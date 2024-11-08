// app.js

import { db } from "./firebase.js";
import { collection, doc, setDoc, addDoc, query, where, getDocs,getDoc, arrayUnion,updateDoc  } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { auth } from "./firebase.js";

console.log("from app.js");


// --------- Speichert authentifizierte Benutzer in der Members-Sammlung
async function saveAuthUserinFireStore(displayName, avatarUrl) {
  const user = auth.currentUser;
  const memberId = `user${Math.floor(Math.random() * 10000)}`;
  const userRef = doc(collection(db, "members"));
  await saveUserIdMemberIdMapping(user.uid, memberId)
  await setDoc(userRef, {
    userId: user.uid,
    memberId: memberId,
    email: user.email,
    displayName: displayName || user.displayName || "Anonym",
    avatarUrl: avatarUrl || null,
    status: "offline",
    memberOfChannelIds: [],
    hasChatIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  console.log(`Benutzerdaten für ${user.uid} mit memberId ${memberId} in Firestore gespeichert`);
}
window.saveAuthUserinFireStore = saveAuthUserinFireStore;

// Hinzufügen der Zuordnung zu `userId_memberid`
async function saveUserIdMemberIdMapping(userId, memberId) {
  const mappingRef = doc(db, "userId_memberid", userId);
  await setDoc(mappingRef, { memberId: memberId });
  console.log(`Zuordnung userId -> memberId gespeichert: ${userId} -> ${memberId}`);
}

async  function getMemberId($userId) {
  const docRef = doc(db, "userId_memberid", $userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    console.log("MemberId data:", docSnap.data());
    return docSnap.data().memberId;
  } else {
    console.log("No such document!");
    return null;
  }
}

window.getMemberId = getMemberId;
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
      memberId: data.memberId,
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
  const q = query(collection(db, "channels"), where("name", "==", name));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    const response = await addDoc(collection(db, "channels"), {
      name: name,
      description: description,
      createdBy: memberId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`Channel created with ID: ${response.id}`);
    return response.id;
  } else {
    console.log("Channel with this name already exists.");
    return querySnapshot.docs[0].id;
  }
}
window.createChannel = createChannel;


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
  const q = query(collection(db, "channels", channelId, "members"));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
  });
}
window.getChannelMembers = getChannelMembers;


// --------- Fügt eine Kanalreferenz zu einem Mitglied hinzu (vereinfacht spätere Suchen)
async function addChannelToMember(memberId, channelId) {
  try {
    const membersRef = collection(db, "members");
    const q = query(membersRef, where("memberId", "==", memberId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("Benutzer mit dieser memberId nicht gefunden");
      return;
    }

    const memberDoc = querySnapshot.docs[0];
    const memberDocId = memberDoc.id;

    const memberRef = doc(db, "members", memberDocId);
    await setDoc(memberRef, {
      memberOfChannelIds: arrayUnion(channelId),
    }, { merge: true });

    console.log(`Kanal ${channelId} wurde zum Benutzer mit memberId ${memberId} hinzugefügt.`);
  } catch (error) {
    console.error("Fehler beim Hinzufügen des Kanals zum Mitglied:", error);
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