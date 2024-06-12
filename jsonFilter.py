import json

class JsonFilter:
    def __init__(self, inputFilePath):
        self.inputFile = inputFilePath

    def loadData(self):
        try:
            with open(self.inputFile, 'r') as file:
                data = json.load(file)
                return data
        except FileNotFoundError:
            print("File not found")
    
    def writeFilteredData(self, data, filepath):
        f = open(filepath, "w")
        jsonText = json.dumps(data, indent=2)
        f.write(jsonText)
        f.close()

    #Section is preHeader, sipHeader, sdp
    def filterPacketsByParameter(self, section, key, value):
        jsonData = self.loadData()
        filteredPackets = []
        for packet in jsonData:
            if packet[section][key] == value:
                filteredPackets.append(packet)
        return filteredPackets

    def filterBySessionID(self, sessionID, outputFile):
        filteredPackets = self.filterPacketsByParameter("preHeader", "sessionID", sessionID)
        filteredDict = dict()
        filteredDict["sessionIdList"] = sessionID
        filteredDict["packetList"] = filteredPackets 
        self.writeFilteredData(filteredPackets, outputFile)

    #All sessions filtered into separate files, might be ideal to select groups of IDs.
    def filterAllSessions(self, folderpath):
        jsonData = self.loadData()
        sessionIdList = []
        for packet in jsonData:
            sID = packet["preHeader"]["sessionID"]
            if sID not in sessionIdList:
                sessionIdList.append(sID)
        for sid in sessionIdList:
            filepath = folderpath + sid + ".json"
            self.filterBySessionID(sid, filepath)
        
        



if __name__ == "__main__":  
    jsonFilter = JsonFilter("raw.json")
    # jsonFilter.filterBySessionID("104328762", "test.json")
    jsonFilter.filterAllSessions("./sessionJson/")