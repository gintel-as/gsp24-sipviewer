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
        self.headerBody = []
        # tempVariables
        self.logInterperterOutput = None

    def extractor(self):
        input = self.logPath + "/" + self.inputFile
        extractor = LogExtractor(input)
        extractor.readLog()
        self.startLine = extractor.getStartLine()
        self.headerBody = extractor.getHeaderBody()

    def logInterperter(self):
        if self.destinationPath == "":
            dest = self.destinationPath
        else: 
            dest = self.destinationPath + "/"

        self.logInterperterOutput = dest + self.inputFile + ".json"
        logInterpreter = LogInterpreter()
        logInterpreter.writeJsonFileFromHeaders(self.startLine, self.headerBody, self.logInterperterOutput)

    def jsonFilter(self):
        if self.destinationPath == "":
            dest = self.destinationPath
        else: 
            dest = self.destinationPath + "/"

        jsonFilter = JsonFilter(self.logInterperterOutput)
        jsonFilter.filterAllSessions(dest)

if __name__ == "__main__":

    # input = input()
    # inputFile = "1.adapter.windows.log"
    # inputFile = "2.Two-Calls.adapter.log"
    inputFile = "adapter_BCT.log"
    logPath = "./logs"
    destinationPath = "./json"
    main = Main(inputFile, logPath, destinationPath)

    main.extractor()
    main.logInterperter()
    main.jsonFilter()


    # print(main.preHeader)
    # print(main.headerBody)
    # print(len(main.preHeader))
    # print(len(main.headerBody))

