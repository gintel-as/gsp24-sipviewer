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

        # the time is not being submitted
        print('main start: ', startTime)
        print('main end: ', endTime)

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
    inputFile = "adapter-as01.log.2024-07-03-09"
    # inputFile = "adapter.2024-06-17-12.log"
    # inputFile = "1.adapter.windows.log"
    # inputFile = "2.Two-Calls.adapter.log"
    # inputFile = "adapter_BCT.log"

    logPath = "./extractor/logs"
    destinationPath = "./extractor/json"
    # logPath = "./logs"
    # destinationPath = "./json"
    main = Main(inputFile, logPath, destinationPath)

    sessionIDs = [
    "104630926",
    "104630927",
    "104630928",
    "104630929",
    "104630928",
    "104630936",
    "104630934",
    "104630932",
    "104630931",
    "104630935",
    "104630930",
    "104630933",
    "104630937",
    "104630938",
    "104630939",
    "104630940",
    "104630941",
    "104630942"
]
    # sessionID = '104630928'
    # sessionID = '104820521'
    # sessionIDs = ['104630929', '104630932']

    main.extractor()
    main.logInterperter(sessionIDs, "", "", "", "+4746180307")
    # main.jsonFilter()
    


    # print(main.preHeader)
    # print(main.headerBody)
    # print(len(main.preHeader))
    # print(len(main.headerBody))

