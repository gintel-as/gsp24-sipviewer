from lxml import etree
import os
import re
from datetime import datetime


class XMLScriptMaker:

    def __init__(self, log_file, include_legs=[]):
        self.log_file = log_file
        self.settings = '<!DOCTYPE scenario SYSTEM "sipp.dtd">'
        self.trees = {}
        self.include_legs = include_legs
        # Enables the possibility of not specifying the legs to sessions
        self.legs_to_sessions_specified = True if include_legs else False
        self.last_timestamp_to_legs = {}
        self.optional_provisional_response = True
        self.regex_variables = {}
        self.variable_counter = 1
        self.comment = "<--Direction_change!-->"

        self.read_log_file()

    def read_log_file(self):
        current_section = []
        msg_type = None
        leg = None
        timestamp_pattern = r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}"

        with open(self.log_file, 'r') as f:
            lines = f.readlines()
            for i in range(len(lines)):
                line = lines[i].strip()  # Remove surplus spaces and lines
                if re.search(timestamp_pattern, line):
                    
                    last_client = client if "client" in locals() else None
                    client = line.split(" ")[-1]
                    direction = line.split(" ")[-2]
                    self.create_etree(client)

                    if current_section:  # If we have anything saved in the current_section list
                        if leg.split(" ")[1] in self.include_legs:
                            if lines[i+1].split(" ")[0].strip() == "PRACK":
                                self.optional_provisional_response = False
                            self.write_section(
                                last_client, leg, current_section, msg_type)
                            self.optional_provisional_response = True
                        current_section = []  # Empty current_section for future use

                    leg = direction + " " + client
                    SDP_space_added = False
                    timestamp = re.search(timestamp_pattern, line).group()

                    splitted_leg = leg.split(" ")
                    # If leg is added to the last_timestamp_to_legs and the message is sent from leg
                    if self.last_timestamp_to_legs[splitted_leg[1]] and splitted_leg[0] == "from":
                        pause = self.calculate_pause(
                            self.last_timestamp_to_legs[splitted_leg[1]], timestamp)
                        self.add_custum_function(
                            client, "pause", milliseconds=str(pause))
                    # Set new last_timestamp on leg
                    self.last_timestamp_to_legs[splitted_leg[1]] = timestamp

                    msg_type = None  # Update msg_type on next line
                    continue  # Skip rest of logic till next line

                if not msg_type:  # Define message type if not defined
                    val = line.split(" ")[0]  # Grab message type
                    if val == "SIP/2.0" :  # If message is a response code, it will start with "SIP/2.0"
                        msg_type = " ".join(line.split(" ")[1:3])
                    elif val != self.comment:
                        msg_type = val

                if line.startswith("RSeq"):
                    self.regex_variables[self.variable_counter] = "RSeq"
                elif line.startswith("RAck"):
                    splitted_line = line.split(" ")
                    splitted_line[1] = f"[${self.variable_counter}]"
                    self.variable_counter += 1
                    line = " ".join(splitted_line)

                if leg:
                    if line and line[1] == "=" and not SDP_space_added: #Adds line before SDP
                        line = "\n" + line
                        SDP_space_added = True
                    current_section.append(line)

            if current_section:  # We need to include the last section
                if leg.split(" ")[1] in self.include_legs:
                    self.write_section(
                        client, leg, current_section, msg_type)

            for tree in self.trees.keys():  # Add responstime partition table to all trees
                self.add_custum_function(
                    tree, "ResponseTimeRepartition", value="10, 20, 30, 40, 50, 100, 150, 200")
                self.add_custum_function(
                    tree, "CallLengthRepartition", value="10, 50, 100, 500, 1000, 5000, 10000")

    def create_etree(self, tree):
        if tree not in self.trees:  # Add tree if it does not excist
            if self.legs_to_sessions_specified:  # Have we specifyed legs?
                if tree in self.include_legs:  # Is tree in spesifyed legs?
                    self.trees[tree] = self.create_XML_tree(tree)
            else:  # Legs not specifyed, create all possible scripts
                self.include_legs.append(tree)
                self.trees[tree] = self.create_XML_tree(tree)
            self.last_timestamp_to_legs[tree] = []

    def calculate_pause(self, old_timestamp, new_timestamp):
        # Convert the timestamps to datetime objects
        start = datetime.strptime(old_timestamp, "%Y-%m-%d %H:%M:%S.%f")
        end = datetime.strptime(new_timestamp, "%Y-%m-%d %H:%M:%S.%f")

        # Calculate the time difference in milliseconds
        diff = (end - start).total_seconds() * 1000
        return diff

    def write_section(self, tree, leg, section, msg_type):
        direction = leg.split(" ")[0]
        if re.search(r"[0-9]+", msg_type) or msg_type in ["ACK", "PRACK"]:     # self.comment only signifiy where an user-agent changes from receiving to sending. We must therefore exclude responses and ACK, since they are exceptions
            if self.comment in section:
                section.remove(self.comment)
        if msg_type.split(" ")[0].isdigit():  # Message is a response
            if direction == "from":
                self.create_response_msg(
                    tree, msg_type, "\n"+'\n'.join(section))
            elif direction == "to":
                self.recieve_response_msg(tree, msg_type)
        else:  # Message is not a respons
            if direction == "from":
                section = list(
                    filter(lambda x: x != "", section))
                section.append("")
                if msg_type in ["ACK", "PRACK"]:  # Add messages that are not retransmitted
                    self.create_msg(
                        "\n"+'\n'.join(section), tree, retrans=False)
                else:
                    self.create_msg(
                        "\n"+'\n'.join(section), tree)
                if msg_type == "INVITE":  # Manual insert 100 trying which might come from CH
                    self.recieve_response_msg(tree, "100 Trying")
            elif direction == "to":
                self.recieve_request_msg(tree, msg_type)

    def recieve_response_msg(self, tree, msg_type):
        if msg_type == "200 OK":
            self.recieve_msg(tree, response=msg_type.split(" ")[
                             0], rrs="true", rtd="true")

        elif msg_type[0] == "1":
            if self.optional_provisional_response:
                self.recieve_msg(tree, response=msg_type.split(" ")[
                    0], optional="true")

            else:
                self.recieve_msg(
                    tree, response=msg_type.split(" ")[0], rrs="true", include_regex=self.variable_counter)
        else:
            self.recieve_msg(tree, response=msg_type.split(" ")[0])

    def create_response_msg(self, tree, msg_type, content):

        if msg_type in ["180 Ringing", "100 Trying"]:
            self.create_msg(content, tree, retrans=False)
        else:
            self.create_msg(content, tree)

    def recieve_request_msg(self, tree, msg_type):
        if msg_type == "INVITE":
            self.recieve_msg(tree, request=msg_type, crlf="true")
        elif msg_type == "ACK":
            self.recieve_msg(tree, request=msg_type,
                             rtd="true", crlf="true")
        else:
            self.recieve_msg(tree, request=msg_type)

    def add_custum_function(self, tree, function, **kwargs):
        child = etree.SubElement(self.trees[tree].getroot(), function)
        for key, value in kwargs.items():
            child.set(key, value)

    def create_XML_tree(self, side):
        # Create tree with root "scenario"
        root = etree.Element('scenario')
        root.set('name', side)
        tree = etree.ElementTree(root)
        return tree

    def create_msg(self, content, tree, retrans=True):
        # Create a msg with CDATA
        msg = etree.SubElement(self.trees[tree].getroot(), "send")
        if retrans:
            msg.set("retrans", "500")
        msg.text = etree.CDATA(content)

    def recieve_msg(self, tree, include_regex=False, **kwargs):
        # Create recv childs with optional kwargs
        child = etree.SubElement(self.trees[tree].getroot(), 'recv')
        for key, value in kwargs.items():
            child.set(key, value)
        if include_regex:
            child2 = etree.SubElement(child, 'action')
            child3 = etree.SubElement(child2, 'ereg')
            child3.set("regexp", ".*")
            child3.set("search_in", "hdr")
            child3.set("header", self.regex_variables[include_regex])
            child3.set("check_it", "true")
            child3.set("assign_to", f"{include_regex}")

    def create_scripts(self, file_path):
        # Create XML script
        for tree in self.trees.keys():
            root = self.trees[tree]

            temp_file = "temp_file.xml"
            file_ID = self.log_file.split('_')[0].split('/')[-1]
            target_path = f"{file_path}{file_ID}_{tree}"
            with open(temp_file, 'w') as file:
                xml_content = etree.tostring(
                    root, encoding='ISO-8859-1').decode('ISO-8859-1')
                formatted_xml_content = xml_content.replace('><', '>\n\n<')
                lines = formatted_xml_content.split("\n")
                if len(lines) > 1:
                    lines.insert(1, self.settings)
                    file.write("\n".join(lines))
                else:
                    file.write(self.settings + "\n")
                    file.write(formatted_xml_content)
            self.indentation_adder(target_path, temp_file)
            os.remove(temp_file)

    def indentation_adder(self, target_path, temp_file_path):
        level = 0
        counter = 0
        with open(target_path, 'w') as final_f, open(temp_file_path, "r") as temp_f:
            for line in temp_f:
                if counter < 2:
                    counter += 1
                    final_f.write(line)
                    continue

                line = line.strip()  # Remove surplus spaces and lines

                if line.startswith("</send") or line.endswith("]]>") or line.startswith("</scenario"):
                    level -= 1

                if line:
                    new_line = level * "\t" + line + "\n"
                else:
                    new_line = "\n"
                final_f.write(new_line)

                if line.startswith("<send") or line.startswith("<![CDATA") or line.startswith("<scenario"):
                    level += 1

    def create_register_script(self, file_path):
        tree = "Register"
        self.trees[tree] = self.create_XML_tree(tree)
        register_str = "\nREGISTER sip:[remote_ip]:[remote_port] SIP/2.0\nVia: SIP/2.0/[transport] [local_ip]:[local_port];branch=[branch]\nRoute: <sip:10.254.32.47:5065;lr>\nFrom: <sip:[field0]@[remote_ip]>;tag=[pid]SIPpTag07[call_number]\nTo: <sip:[field0]@[remote_ip]>\nCall-ID: [call_id]\nCSeq: [cseq] REGISTER\nContact: <sip:[field0]@[local_ip]:[field1]>\nContent-Length: 0\nMax-Forwards: 70\nExpires: 300\n"
        root = self.trees[tree].getroot()
        self.create_msg(register_str, tree)
        self.recieve_msg(tree, response="200")
        with open(file_path+tree, 'w') as file:
            xml_content = etree.tostring(
                root, encoding='ISO-8859-1').decode('ISO-8859-1')
            formatted_xml_content = xml_content.replace('><', '>\n\n<')
            lines = formatted_xml_content.split("\n")
            if len(lines) > 1:
                lines.insert(1, self.settings)
                file.write("\n".join(lines))
            else:
                file.write(self.settings + "\n")
                file.write(formatted_xml_content)


if __name__ == "__main__":
    XML_script_maker = XMLScriptMaker(
        "../logFiles/304285078_formatted.log", ["LegA", "LegB"])
    XML_script_maker.create_scripts("../XML_scripts/")
    XML_script_maker.create_register_script("../XML_scripts/")
