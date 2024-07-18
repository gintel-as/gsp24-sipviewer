from extractor import LogExtractor
from logInterpreter import LogInterpreter
from jsonFilter import JsonFilter
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

    def jsonFilter(self):
        if self.destinationPath == "":
            dest = self.destinationPath
        else: 
            dest = self.destinationPath + "/"

        jsonFilter = JsonFilter(self.logInterperterOutput)
        jsonFilter.filterAllSessions(dest)

if __name__ == "__main__":

    # input = input()
    #  inputFile = "3.adapter.log"
    inputFile = "3.adapter.log.2"
    # inputFile = "adapter-as01.log.2024-07-03-09"
    # inputFile = "adapter.2024-06-17-12.log"
    # inputFile = "1.adapter.windows.log"
    # inputFile = "2.Two-Calls.adapter.log"
    # inputFile = "adapter_BCT.log"

    logPath = "./extractor/logs"
    destinationPath = "./extractor/json"
    # logPath = "./logs"
    # destinationPath = "./json"
    main = Main(inputFile, logPath, destinationPath)

    sessionIDs = []

    # sessionID = '104630928'
    # sessionID = '104820521'
    # sessionIDs = ['104630929', '104630932']

    main.extractor()
    main.logInterperter(sessionIDs, "", "", "", "")
    # main.jsonFilter()
    


    # print(main.preHeader)
    # print(main.headerBody)
    # print(len(main.preHeader))
    # print(len(main.headerBody))

