{members}
    <memberID>
        ( displayName, avatarUrl, status, createdAt, updatedAt)

{memberPrivate}
    <memberID>
        ( userId,email, memberId, memberOfChannels[], chatIds[])

{chats}
    <chatId>                   
        (from, to, lastMessage, lastMessageTimestamp, createdAt, updatedAt,visibility)
        {chatMessages}            
            <messageId>         
                (text, senderId, timestamp, thread, threadId, attachments, reactions, [reactionIds])

{channels}
    <channelId>                    
        (name, description, createdBy, createdAt, updatedAt,visibility)
            {members}                  
                <memberId>
                    (joinedAt, role)
            {channelMessages}          
                <messageId>          
                    (senderMemberID, content, timestamp, thread, threadId, attachments, reactions, [reactionIds])

{threads}
    <threadId>                    
        (channelId, originalMessageId, createdAt)
        {threadMessages}          
                (senderId, content, timestamp, attachments, reactions, [reactionIds])

{reactions}
    <reactionId>                  
        (messageId, threadId, channelId, memberId, emoji, timestamp)
