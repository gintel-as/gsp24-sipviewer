import json

class JsonFilter:
    def __init__(self, inputFilePath, outputFilePath):
        self.inputFile = inputFilePath
        self.outputFile = outputFilePath

    def loadData(self):
        try:
            with open(self.inputFile, 'r') as file:
                data = json.load(file)
                return data
        except FileNotFoundError:
            print("File not found")
    
    def writeFilteredData(self, data):
        f = open(self.outputFile, "w")
        jsonText = json.dumps(data, indent=2)
        f.write(jsonText)
        f.close()

    def filterByParameter(self, section, key, value):
        jsonData = self.loadData()
        filteredPackets = []
        for packet in jsonData:
            if packet[section][key] == value:
                filteredPackets.append(packet)
        self.writeFilteredData(filteredPackets)

    def filterBySessionID(self, sessionID):
        self.filterByParameter("preHeader", "sessionID", sessionID)


if __name__ == "__main__":  
    jsonFilter = JsonFilter("raw.json", "test.json")
    jsonFilter.filterBySessionID("104328762")