// app.js

import { db } from "./firebase.js";
import { collection, doc, setDoc, addDoc, query, where, getDocs, getDoc, arrayUnion, updateDoc, documentId } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { auth } from "./firebase.js";

console.log("from app.js");


// --------- Speichert authentifizierte Benutzer in der Members-Sammlung
async function saveAuthUserinFireStore(displayName, avatarUrl) {
  const user = auth.currentUser;
  const memberId = `user${Math.floor(Math.random() * 10000)}`;

  await savePrivateMemberFields(user, memberId);

  // Öffentliche Felder in der Members-Sammlung speichern
  const userRef = doc(collection(db, "members"));
  await setDoc(userRef, {
    displayName: displayName || user.displayName || "Anonym",
    avatarUrl: avatarUrl || null,
    status: "offline",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
window.saveAuthUserinFireStore = saveAuthUserinFireStore;


async function savePrivateMemberFields(user, memberId) {
  const privateUserRef = doc(db, "memberPrivate", memberId);
  
  await setDoc(privateUserRef, {
    userId: user.uid,
    memberId: memberId,
    email: user.email,
    memberOfChannels: [],  
    chatIds: [],           
  });
  
  console.log("Folgende private Felder gespeichert:");
  console.log("memberId:", memberId);
  console.log("email:", user.email);
  console.log("memberOfChannels:", []);
  console.log("chatIds:", []);
}
// --------- Ruft alle privaten Daten aus der `memberPrivate`-Sammlung anhand der `userId` ab
async function getMemberPrivateData(userId) {
  const membersRef = collection(db, "memberPrivate");
  const q = query(membersRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);

  // Überprüfen, ob die Abfrage ein Dokument gefunden hat
  if (!querySnapshot.empty) {
    const memberDoc = querySnapshot.docs[0]; // Nimm das erste gefundene Dokument
    const data = memberDoc.data();

    console.log("Member private data:", data); // Gibt die Daten des Dokuments aus
    return data;
  } else {
    console.log("Kein Dokument mit der userId:", userId, "gefunden.");
    return null;
  }
}


window.getMemberPrivateData = getMemberPrivateData;


// --------- Ruft alle Mitglieder aus der Members-Sammlung ab (z. B. für Profil- oder Mitgliederlisten)
async function getAllMembers() {
  const membersRef = collection(db, "members");
  const querySnapshot = await getDocs(membersRef);
  const members = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    members.push({
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
    });
  });
  console.log("All Members:", members);
  return members;
}
window.getAllMembers = getAllMembers;


// --------- Ruft ein bestimmtes Mitglied anhand der memberId ab
async function getMemberByMemberId(memberId) {
  try {
    const membersRef = collection(db, "members");
    const q = query(membersRef, where("memberId", "==", memberId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("Mitglied mit dieser memberId nicht gefunden. memberId:", memberId);
      return null;
    }

    const memberDoc = querySnapshot.docs[0];
    const memberData = memberDoc.data();
    console.log("Mitgliedsdaten:", memberData);

    return memberData;
  } catch (error) {
    console.error("Fehler beim Abrufen des Mitglieds:", error);
    return null;
  }
}
window.getMemberByMemberId = getMemberByMemberId;


// --------- Erstellt einen neuen Kanal (anfangs ohne Mitglieder und Nachrichten)
async function createChannel(name, description, memberId) {
    const response = await addDoc(collection(db, "channels"), {
      name: name,
      description: description,
      createdBy: memberId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`Channel created with ID: ${response.id}`);
    return response.id;
}
window.createChannel = createChannel;




/*
 //TODO
  const q = query(collection(db, "channels"), where("name", "==", name));
  const querySnapshot = await getDocs(q);
*/


// --------- Fügt ein Mitglied zu einem Kanal hinzu
async function addMemberToChannel(channelId, memberId) {
  console.log("!!!addMemberToChannel", channelId, memberId);
  await setDoc(doc(db, "channels", channelId, "members", memberId), {
    joinedAt: new Date().toISOString(),
    role: "simple_member",
  }, { merge: true });
  console.log(`Member ${memberId} added to channel ${channelId}`);
}
window.addMemberToChannel = addMemberToChannel;


// --------- Ruft alle Mitglieder eines bestimmten Kanals ab
async function getChannelMembers(channelId) {
  console.log("!!!getChannelMembers", channelId);

  const membersRef = collection(db, "channels", channelId, "members");
  const q = query(membersRef);
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    console.log("Erstes Dokument in querySnapshot:", querySnapshot.docs[0].data());
        querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
    });
  } else {
    console.log("Keine Mitglieder für diesen Kanal gefunden.");
  }
}

window.getChannelMembers = getChannelMembers;

async function addChannelToMember(memberId, channelId) {
  try {
    // Referenz zum `memberPrivate`-Dokument mit der `userId`, die `memberId` zugeordnet ist
    const memberPrivateDocRef = doc(db, "memberPrivate", memberId); // Falls `memberId` der userId entspricht

    // Aktualisiere `memberOfChannels`-Array in `memberPrivate`, ohne das Dokument zuerst zu lesen
    await setDoc(
      memberPrivateDocRef,
      {
        memberOfChannels: arrayUnion(channelId), // Fügt die `channelId` hinzu, falls noch nicht vorhanden
      },
      { merge: true }
    );

    console.log(`Kanal ${channelId} wurde zum Benutzer mit memberId ${memberId} in memberPrivate hinzugefügt.`);
  } catch (error) {
    console.error("Fehler beim Hinzufügen des Kanals zum Mitglied in memberPrivate:", error);
  }
}

window.addChannelToMember = addChannelToMember;



async function getAllChannels() {
  const channelsRef = collection(db, "channels");
  const channelsSnapshot = await getDocs(channelsRef);
  const channelsData = [];
  for (const channelDoc of channelsSnapshot.docs) {
    
    const channelData = {
      id: channelDoc.id,    
      ...channelDoc.data()   
    };
    channelsData.push(channelData);
  }
  console.log("All Channels:", channelsData);
  return { channels: channelsData };
}

window.getAllChannels = getAllChannels;



// ------ BULK 
async function getChannelsByIds(channelIds) {
  const channelsRef = collection(db, "channels");
  console.log("channelRef:", channelsRef);
  console.log("channelIds:", channelIds);
  const q = query(channelsRef, where(documentId(), "in", channelIds));
  const querySnapshot = await getDocs(q);
  const channelsData = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));

  console.log("Gefundene Kanäle:", channelsData);
  return { channels: channelsData };
}

window.getChannelsByIds = getChannelsByIds;


// Funktion zum Abrufen und Aktualisieren der Rolle eines Mitglieds in einem Kanal
async function updateMemberRole(channelId, memberId, newRole) {
    const memberRef = doc(db, "channels", channelId, "members", memberId);
      await updateDoc(memberRef, {
        role: newRole
      });
      console.log(`Rolle von Mitglied ${memberId} in Kanal ${channelId} aktualisiert auf: ${newRole}`);
}
window.updateMemberRole = updateMemberRole;


/*

async function createChat(from, to) {
  const q = query(collection(db, "chats"), where("from", "in", [from, to]), where("to", "in", [from, to]));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    const chatRef = await addDoc(collection(db, "chats"), {
      from: from,
      to: to,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`Chat created with ID: ${chatRef.id}`);
    return chatRef.id;
  } else {
    console.log("Chat already exists between users.");
    return querySnapshot.docs[0].id;
  }
}
window.createChat = createChat;

async function addChatMessage(chatId, senderRefId, text) {
  const messageRef = await addDoc(collection(db, "chats", chatId, "chatMessages"), {
    text: text,
    senderRefId: senderRefId,
    timestamp: new Date().toISOString(),
    reactionIds: [],
  });
  console.log(`Message added to chat ${chatId} with ID: ${messageRef.id}`);
}
window.addChatMessage = addChatMessage;

// Kanalnachrichten
async function addChannelMessage(channelId, text) {
  const user = auth.currentUser;
  const messageRef = await addDoc(collection(db, "channels", channelId, "channelMessages"), {
    text: text,
    senderRefId: user.uid,
    timestamp: new Date().toISOString(),
  });
  console.log(`Message added to channel ${channelId} with ID: ${messageRef.id}`);
}
window.addChannelMessage = addChannelMessage;

async function getChannelMessages(channelId) {
  const q = query(collection(db, "channels", channelId, "channelMessages"));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
  });
}
window.getChannelMessages = getChannelMessages;




*/