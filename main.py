from extractor import Extractor
from logInterpreter import LogInterpreter
from jsonFilter import JsonFilter
import os, argparse


class Main:
    def __init__(self, inputFile):
        self.inputFile = inputFile
        # Extractor variables
        self.preHeader = []
        self.headerSDP = []

    def extractor(self):
        # print("Extractor")
        extractor = Extractor(self.inputFile)
        extractor.readLog()
        self.preHeader = extractor.getPreHeader()
        self.headerSDP = extractor.getHeaderSDP()

    def logInterperter(self):
        print("logInterperter")

    def jsonFilter(self):
        print("JSON")
    

if __name__ == "__main__":

    # input = input()
    input = "./logs/1.adapter.log"
    main = Main(input)

    main.extractor()
    print(main.preHeader)
    print(main.headerSDP)
    print(len(main.preHeader))
    print(len(main.headerSDP))

    # main.logInterperter()
    # main.jsonFilter()
