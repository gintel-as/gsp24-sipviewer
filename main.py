from extractor import Extractor
from logInterpreter import LogInterpreter
from jsonFilter import JsonFilter
import os, argparse


class Main:
    def __init__(self, inputFile, logPath, destinationPath):
        self.inputFile = inputFile
        self.logPath = logPath
        self.destinationPath = destinationPath
        # Extractor variables
        self.preHeader = []
        self.headerSDP = []

    def extractor(self):
        # print("Extractor")
        input = self.logPath + "/" + self.inputFile
        extractor = Extractor(input)
        extractor.readLog()
        self.preHeader = extractor.getPreHeader()
        self.headerSDP = extractor.getHeaderSDP()

    def logInterperter(self):
        if self.destinationPath == "":
            dest = self.destinationPath
        else: 
            dest = self.destinationPath + "/"

        output = dest + self.inputFile + ".json"
        logInterpreter = LogInterpreter()
        logInterpreter.writeJsonFileFromHeaders(self.preHeader, self.headerSDP, output)

    def jsonFilter(self):
        print("JSON")
    

if __name__ == "__main__":

    # input = input()
    inputFile = "1.adapter.windows.log"
    logPath = "./logs"
    destinationPath = "./json"
    main = Main(inputFile, logPath, destinationPath)

    main.extractor()
    main.logInterperter()
    # print(main.preHeader)
    # print(main.headerSDP)
    # print(len(main.preHeader))
    # print(len(main.headerSDP))

    # main.logInterperter()
    # main.jsonFilter()
