from extractor import Extractor
from logInterpreter import LogInterpreter
from jsonFilter import JsonFilter
import os, argparse


class Main:
    def __init__(self, inputFile):
        self.inputFile = inputFile

    def extractor(self):
        print("Extractor")

    def logInterperter(self):
        print("logInterperter")

    def jsonFilter(self):
        print("JSON")
    

if __name__ == "__main__":

    input = input()
    main = Main(input)

    main.extractor()
    main.logInterperter()
    main.jsonFilter()
