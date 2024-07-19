from extractor import LogExtractor
from logInterpreter import LogInterpreter
import os, argparse


class Main:
    def __init__(self, inputFile, logPath, destinationPath):
        self.inputFile = inputFile
        self.logPath = logPath
        self.destinationPath = destinationPath
        # Extractor variables
        self.startLine = []
        self.header = []
        self.body = []
        # tempVariables
        self.logInterperterOutput = None

    
    def extractor(self):
        input = self.logPath + "/" + self.inputFile
        extractor = LogExtractor(input)
        extractor.readLog()
        self.startLine = extractor.getStartLine()
        self.header = extractor.getHeader()
        self.body = extractor.getBody()

    def logInterperter(self, sessionID, startTime, endTime, sipTo, sipFrom):

        if self.destinationPath == "":
            dest = self.destinationPath
        else: 
            dest = self.destinationPath + "/"

        self.logInterperterOutput = dest + self.inputFile + ".json"
        logInterpreter = LogInterpreter()
        logInterpreter.writeJsonFileFromHeaders(self.startLine, self.header,self.body, self.logInterperterOutput, sessionID, startTime, endTime, sipTo, sipFrom)

if __name__ == "__main__":
    #InputFile for testing
    inputFile = ""

    logPath = "./extractor/logs"
    destinationPath = "./extractor/json"
    # logPath = "./logs"
    # destinationPath = "./json"
    main = Main(inputFile, logPath, destinationPath)

    sessionIDs = []

    main.extractor()
    main.logInterperter(sessionIDs, "", "", "", "")
