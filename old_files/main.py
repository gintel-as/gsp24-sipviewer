from old_files.logToXML import XMLScriptMaker
from old_files.logFilter import logFilter
from old_files.createDynamicSIPpMessages import createDynamicSIPpMessages
import os
import argparse


def main(source_file, target_path, log_path, sessions_to_legs=False, include_raw_log_files=False, include_formatted_log_files=False):
    readAndFilterLog = logFilter(source_file, log_path)
    readAndFilterLog.readLog()
    readAndFilterLog.splitTraceAndFormat()
    logIDArr = readAndFilterLog.getLogIDarr()

    for ID in logIDArr:
        if sessions_to_legs:
            include_legs = [
                key for key, value in sessions_to_legs.items() if value == ID]
        else:
            include_legs = []

        if sessions_to_legs != False:
            if not include_legs:
                continue

        file = log_path + ID + '/' + ID + '.log'
        formatted_file = log_path + ID + '/' + ID + "_formatted.log"
        create_dynamic_SIPp_messages = createDynamicSIPpMessages(
            file, formatted_file)
        create_dynamic_SIPp_messages.read_log()

        if not include_raw_log_files:
            os.remove(file)

        XML_script_maker = XMLScriptMaker(formatted_file, include_legs)
        XML_script_maker.create_scripts(target_path)

        if not include_formatted_log_files:
            os.remove(formatted_file)


if __name__ == "__main__":
    dict = {}

    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=str, help='Source file.')
    parser.add_argument('-d', '--destination', type=str, default='../XML_scripts/', help='Destination directory for outputing the XML scripts. Default value: ../XML_scripts/')
    parser.add_argument('-l', '--log_path', type=str, default='../logFiles/', help='Destination directory for filtered and formatted logs. Default value: ../logFiles/')
    parser.add_argument('-ls', '--legs_and_sessions', nargs='*', type=str, help='Pairs of Leg and Session values.')
    parser.add_argument('-r', '--raw_log', action='store_true', help='Optional flag for keeping the full log')
    parser.add_argument('-f', '--formatted_log', action='store_true', help='Optional flag for keeping the formatted log')
    args = parser.parse_args()

    dict = {}
    if args.legs_and_sessions is not None:
        if len(args.legs_and_sessions) % 2 != 0:
            print("Error: Each Leg must have a corresponding sessionID.")
            exit()

        # Update the dictionary with the provided legs and sessions
        for i in range(0, len(args.legs_and_sessions), 2):
            leg_name = args.legs_and_sessions[i]
            sessiond_ID = args.legs_and_sessions[i + 1]
            dict[leg_name] = sessiond_ID

    if not dict:
        sessions_to_legs = False
    else:
        sessions_to_legs = dict

    source_file = str(args.source)
    target_path = str(args.destination)
    log_path = str(args.log_path)
    include_raw_log_files = args.raw_log
    include_formatted_log_files = args.formatted_log

    main(source_file, target_path, log_path,
        sessions_to_legs=sessions_to_legs,
        include_raw_log_files=include_raw_log_files,
        include_formatted_log_files=include_formatted_log_files
    )
