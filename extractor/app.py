from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
from main import Main
import os, threading, shutil, pytz
from flask_apscheduler import APScheduler
from apscheduler.triggers.cron import CronTrigger

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
ERROR_FOLDER = 'fileErrors'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(PROCESSED_FOLDER):
    os.makedirs(PROCESSED_FOLDER)
if not os.path.exists(ERROR_FOLDER):
    os.makedirs(ERROR_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER
app.config['FILE_ERROR_FOLDER'] = ERROR_FOLDER


def processFile(inputFile, logPath, destinationPath, errorPath, sessionID, startTime, endTime, sipTo, sipFrom):
    try:
        main_instance = Main(inputFile, logPath, destinationPath)
        main_instance.extractor()
        main_instance.logInterperter(sessionID, sipTo, sipFrom, startTime, endTime)
    except Exception as e:
        print(f"Error processing file {inputFile}: {e}")
        errorPath = os.path.join(errorPath, inputFile)
        with open(errorPath, 'w') as file:
            pass
    
    finally:
        inputFile_path = os.path.join(logPath, inputFile)
        try:
            if os.path.exists(inputFile_path):
                os.remove(inputFile_path)
                print(f"Deleted uploaded file: {inputFile_path}")
        except Exception as e:
            print(f"Error deleting uploaded file {inputFile_path}: {e}")


@app.route('/api/uploadAndExtract', methods=['POST'])
def uploadAndExtract():
    if 'file' not in request.files:
        return jsonify({'message': 'No file part in the request'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    if file:
        try:
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(filepath)

            # Turn string of sessionIDs into array
            sessionID = request.form.get('sessionID', '')
            if sessionID == '':
                sessionIDArray = []
            else:
                sessionIDArray = [x.strip() for x in sessionID.split(',')]

            sipTo = request.form.get('sipTo', '')
            sipFrom = request.form.get('sipFrom', '')
            startTime = request.form.get('startTime', '')
            endTime = request.form.get('endTime', '')

            print("sipTo: ", sipTo)
            print("sipFrom: ", sipFrom)
            print("startTime: ", startTime)
            print("endTime: ", endTime)

            # Start file processing in a separate thread
            threading.Thread(target=processFile, args=(file.filename, app.config['UPLOAD_FOLDER'], app.config['PROCESSED_FOLDER'], app.config['FILE_ERROR_FOLDER'], sessionIDArray, sipTo, sipFrom, startTime, endTime)).start()
            
            processed_filename = f"{file.filename}.json"
            return jsonify({'message': 'File uploaded and processing started', 'processed_filename': processed_filename}), 200

        except Exception as e:
                return jsonify({'message': f'Error uploading or processing file: {e}'}), 500


@app.route('/api/check_status/<filename>', methods=['GET'])
def check_status(filename):
    processed_filepath = os.path.join(app.config['PROCESSED_FOLDER'], filename)
    error_filepath = os.path.join(app.config['FILE_ERROR_FOLDER'], filename).strip(".json")
    if os.path.exists(processed_filepath):
        return jsonify({'status': 'ready'}), 200
    #If error file has been created, send response error and delete error-file
    if os.path.exists(error_filepath):
        os.remove(error_filepath)
        print("Error file removed")
        return jsonify({'status': 'error'}), 200
    return jsonify({'status': 'processing'}), 202


@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    processed_filepath = os.path.join(app.config['PROCESSED_FOLDER'], filename)
    try:
        if not os.path.exists(processed_filepath):
            return jsonify({'message': 'File not found'}), 404
        
        response = send_from_directory(app.config['PROCESSED_FOLDER'], filename, as_attachment=True)
        os.remove(processed_filepath)
        return response
    
    except FileNotFoundError:
        return jsonify({'message': 'File not found'}), 404
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500

def delete_folder_contents(folder):
    for filename in os.listdir(folder):
        file_path = os.path.join(folder, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print('Failed to delete %s. Reason: %s' % (file_path, e))

def job():
    print("Deleting upload and processed folder content")
    delete_folder_contents(app.config['UPLOAD_FOLDER'])
    delete_folder_contents(app.config['PROCESSED_FOLDER'])
    delete_folder_contents(app.config['FILE_ERROR_FOLDER'])

if __name__ == '__main__':
    scheduler = APScheduler()
    cron_trigger = CronTrigger(hour=23, minute=0, timezone=pytz.timezone('Europe/Oslo'))
    scheduler.add_job(id='Scheduled Task', func=job, trigger=cron_trigger)
    scheduler.start()

    app.run(debug=True)
