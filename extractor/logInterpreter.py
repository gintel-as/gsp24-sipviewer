import json, re
from collections import defaultdict

class LogInterpreter:


    def __init__(self):
        self.relatedSessionFormatPattern = r'X-Gt(?:-[A-Za-z0-9]+)?-SessionId'

    
    def createStartLineDict(self, time, sessionID, messageID, direction, party, method):
        startLineDict = {
            "time": time,
            "sessionID": sessionID,
            "messageID": messageID,
            "direction": direction,
            "party": party,
            "method": method # Method is the type of message (e.g., INVITE)
        }
        return startLineDict
    
    
    def createSipHeaderDict(self, method, sipTo, sipFrom, content):
        sipHeaderDict = {
            "method": method,
            "to": sipTo,
            "from": sipFrom,
            "content": content
        }
        return sipHeaderDict
    

    def createBodyDict(self, content):
        bodyDict = {
            "content": content
        }
        return bodyDict


    def createPacketDict(self, startLineDict, sipHeaderDict, bodyDict):
        packetDict = {
            "startLine": startLineDict,
            "sipHeader": sipHeaderDict,
            "body": bodyDict 
        }
        return packetDict


    def checkForInitialInvite(self, line, direction):
        toWithoutTag = r'^<sip:[A-Za-z0-9+]+@.*>(?!;tag=.*$)'
        initialInvite = False

        if line != "":
            try:
                match = re.match(toWithoutTag, line)
                if match and direction == 'from':
                    initialInvite = True
            except Exception as e:
                print(f"Error processing line: {line}, Error: {e}")
        return initialInvite

    def extractHeader(self, sipHeader):
        sipContent = defaultdict(list)
        pattern = r'^([A-Za-z0-9.-]+)(?:\s*(sip:|:)\s*)(.*)$'
        sipContent["Header"].append(sipHeader[0])
        for i in range(1,len(sipHeader)):
            x = sipHeader[i]
            if x != "":
                try:
                    match = re.match(pattern, x)
                    sipContent[match.group(1)].append(match.group(3))
                except:
                    sipContent['Unreadable Line'].append(x)
        method = self.findStartLine(sipContent, sipHeader)
        return method, sipContent


    # Find message type if message is response (e.g., INVITE, BYE etc.) and remove excess information (e.g., sip:4794001002@192.168.56.1:60129)
    def findStartLine(self, sipContent, header):
        startLineEntry = sipContent["Header"][0]
        method = ""

        # If message is response remove excess information and add message type from CSeq 
        if startLineEntry.startswith('SIP/2.0'):
            responsePattern = r'.* (\d{3} .*)'
            responseMatch = re.match(responsePattern, startLineEntry)
            if responseMatch:
                method = responseMatch.group(1)

            CseqValue = sipContent['CSeq'][0]
            startLineCseq = ""
            for char in CseqValue:
                if char.isalpha():
                    startLineCseq += char
            method = method + ' (' + startLineCseq + ')'
            return method
           
        # If message is request, remove excess information
        elif startLineEntry.endswith('SIP/2.0'):
            requestPattern = r'^(ACK|PRACK|INVITE|BYE|CANCEL|UPDATE|INFO|SUBSCRIBE|NOTIFY|REFER|MESSAGE|OPTIONS|PUBLISH|REGISTER) .*'
            requestMatch = re.match(requestPattern, startLineEntry)
            if requestMatch:
                method = requestMatch.group(1)
                return method 


    def interpretStartLineString(self, startLineString):
        pattern = r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{3}) .* (\d+|NoRefNo) .* id=([A-Fa-f0-9]+) (to|from) (\w+)'
        match = re.match(pattern, startLineString)
        timestamp = match.group(1)
        sessionId = match.group(2)
        messageId = match.group(3)
        direction = match.group(4)
        party = match.group(5)
        if party == "NULL":
            party = 'Not Identified'
        return timestamp, sessionId, messageId, direction, party
    

    def createJsonFormattedMessagePacket(self, time, sessionID, messageID, direction, party, method, sipContent, body):
        startLineDict = self.createStartLineDict(time, sessionID, messageID, direction, party, method)
        sipHeaderDict = dict(sipContent)
        bodyDict = self.createBodyDict(body)
        packetDict = self.createPacketDict(startLineDict, sipHeaderDict, bodyDict)
        return packetDict

    
    # Can modify the sessionInfoDict to add bool for initial INVITE
    def createSessionInfoDict(self, sessionID, time, sipTo, sipFrom):
        return {
            "sessionID": sessionID,
            "time": time,
            "to": sipTo,
            "from": sipFrom,
            "participants": [],
            "associatedSessions": [],
            # "initialInvite": bool
        }
    
    
    def createEmptySessionDict(self, sessionID, time, sipTo, sipFrom):
        return {
            "sessionInfo": self.createSessionInfoDict( sessionID, time, sipTo, sipFrom),
            "messages": []
        }
    

    def checkIfDictKeysContainsRelatedSessions(self, sipHeader):
        pattern = re.compile(self.relatedSessionFormatPattern)
        matchingHeaders = [key for key in sipHeader if pattern.search(key)]
        return matchingHeaders


    def filterAssociatedSessions(self, dict, sessionIDs):
        result = {} 
        relatedSessions = [] 

        if not sessionIDs:
            print('No sessionIDs')
            return json.dumps(list(dict.values()), indent=2)
        else:
            for sessionID in sessionIDs: 
                # Finds relatedSessions for selected sessionID
                if sessionID in dict:
                    relatedSessions = dict[sessionID]['sessionInfo']['associatedSessions']
                    print(f"Related sessions for {sessionID}: {relatedSessions}")
                    # Filters out all sessions not in relatedSessions[]
                    for session in relatedSessions:
                        if session in dict:
                            result[session] = dict[session]
                        else: 
                            print(f"Related session {session} was not found in this file.")

                else:
                    print(f"Session ID {sessionID} not found.")
                    result = {}
            return json.dumps(list(result.values()), indent=2)


    def createJsonFormattedSessionPacketsFromExtractedHeaders(self, startLines, headers, body):
        #SessionPackets is dict for session data, sessionIDtoAssociatedDict is a defaultDict for bidirecitonal linking of associated sessions
        sessionPackets = {}
        sessionIDtoAssociatedDict = defaultdict(set)
        #Iterate over all sessions
        for i in range(len(startLines)):
            try:
                #Fetch message details
                time, sessionID, messageID, direction, party = self.interpretStartLineString(startLines[i])
                method, sipContent = self.extractHeader(headers[i])
                message = self.createJsonFormattedMessagePacket(time, sessionID, messageID, direction, party, method, sipContent, body[i])

                if sessionID not in sessionPackets.keys():
                    sessionPackets[sessionID] = self.createEmptySessionDict(sessionID, time, sipContent["To"][0], sipContent["From"][0])
                associatedSessionIDKeys = self.checkIfDictKeysContainsRelatedSessions(sipContent)

                #Add to SessionInfo if attribtes exsist in message
                currentSession = sessionPackets[sessionID]
                currentSession['messages'].append(message)
                currentSessionInfo = currentSession['sessionInfo']

                if sipContent['To']:
                    for el in sipContent['To']:
                        initialInviteBool = self.checkForInitialInvite(el, direction)
                        # if initialInviteBool:
                        #     print('packet: ', i, initialInviteBool)
                        if el not in currentSessionInfo['participants']:
                            currentSessionInfo['participants'].append(el)
                
                if sipContent['From']:
                    for el in sipContent['From']:
                        if el not in currentSessionInfo['participants']:
                            currentSessionInfo['participants'].append(el)
                
                for associatedSessionKey in associatedSessionIDKeys:
                    relatedSessionIDs = sipContent[associatedSessionKey][0].replace(' ', '').split(',')
                    #For each related sessionID to current session, fetch all their associated sessionIDs and populate array
                    for el in relatedSessionIDs:
                        if len(sessionIDtoAssociatedDict[el]) > 0:
                          relatedSessionIDs= relatedSessionIDs + list(sessionIDtoAssociatedDict[el])
                    #Convert to set to remove duplicates, and update dictionary entry of all sessionIDs
                    relatedSessionIDs = set(relatedSessionIDs)
                    for el in relatedSessionIDs:
                        sessionIDtoAssociatedDict[el].update(relatedSessionIDs)

            except Exception as e:
                print("Packet not included due to error")
                print(e)

        for sessionID in sessionPackets.keys():
            if sessionID in sessionIDtoAssociatedDict.keys():
                sessionPackets[sessionID]["sessionInfo"]["associatedSessions"] = list(sessionIDtoAssociatedDict[sessionID])
                
        return sessionPackets
    
    
    def writeJsonFileFromHeaders(self, startLines, headers, body, filePath, sessionIDs):
        f = open(filePath, "w")
        jsonText = self.createJsonFormattedSessionPacketsFromExtractedHeaders(startLines, headers, body)
        jsonText = self.filterAssociatedSessions(jsonText, sessionIDs)
        f.write(jsonText)
        f.close()


if __name__ == "__main__":  
    logInterpreter = LogInterpreter()
    filePath = "./json/test.json"
    
    # Remember to add to the arrays for testing
    startLines = []
    headers = []
    body = []

    # sessionIDs = ['104820521', '104820522']
    sessionIDs = []

    logInterpreter.writeJsonFileFromHeaders(startLines, headers, body, filePath, sessionIDs)