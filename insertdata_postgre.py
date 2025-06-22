import psycopg2
import csv
import re
import json  # Add this to handle JSON conversion
import sys
# PostgreSQL connection string (use either internal or external URL from Render)
DATABASE_URL = "postgres://<user>:<password>@<host>:<port>/<database>"  # Replace with your full database URL

# Function to create the table
def create_table(conn):
    create_table_query = '''
    CREATE TABLE IF NOT EXISTS relations (
        id SERIAL PRIMARY KEY,
        year INT NOT NULL,
        company1 VARCHAR(255) NOT NULL,
        company1_ticker VARCHAR(255) NOT NULL,
        company1_sector VARCHAR(255) NOT NULL,
        company1_cap FLOAT NOT NULL,
        company2 VARCHAR(255) NOT NULL,
        company2_ticker VARCHAR(255) NOT NULL,
        company2_sector VARCHAR(255) NOT NULL,
        company2_cap FLOAT NOT NULL,
        relation_value FLOAT NOT NULL,
        ranking INT NOT NULL,
        mutual_company1 JSONB NOT NULL,
        mutual_company2 JSONB NOT NULL,
        summary TEXT NOT NULL
    );
    '''
    with conn.cursor() as cur:
        cur.execute(create_table_query)
        conn.commit()
    print("Table 'relations' created or already exists.")

# Function to insert data
# Function to insert data
def insert_data(conn, data, year):
    insert_query = '''
    INSERT INTO relations (year, company1, company1_ticker, company1_sector, company1_cap, company2, company2_ticker, company2_sector, company2_cap, relation_value, ranking, mutual_company1, mutual_company2, summary)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    '''
    count = 1
    with conn.cursor() as cur:
        for record in data:
            # Convert mutual_company1 and mutual_company2 dictionaries to JSON strings
            record = (
                year,
                record[0],
                record[1],
                record[2],
                record[3],
                record[4],
                record[5],
                record[6],
                record[7],
                record[8],
                record[9],
                json.dumps(record[10]),  # Convert dict to JSON string
                json.dumps(record[11]),  # Convert dict to JSON string
                record[12]
            )
            cur.execute(insert_query, record)
            print("insert: ", count)
            count += 1
        conn.commit()

    print("Data inserted successfully.")
    
def fix_json_string(json_string):
    # Replace single quotes with double quotes
    json_string = json_string.replace("{'", '{@@')
    json_string = json_string.replace('{"', '{@@')
    
    json_string = json_string.replace("':", '@@:')
    json_string = json_string.replace('":', '@@:')
    
    
    
    # json_string = json_string.replace(".', ", '.@@, ')
    # json_string = json_string.replace('.", ', '.@@, ')
    json_string = re.sub(r"(<strong>\(From item\w{1,2}\)</strong>)'", r'\1@@', json_string)
    json_string = re.sub(r'(<strong>\(From item\w{1,2}\)</strong>)"', r'\1@@', json_string)
    
    json_string = json_string.replace("@@, '", '@@, @@')
    json_string = json_string.replace('@@, "', '@@, @@')
    
    json_string = json_string.replace("], '", '], @@')
    json_string = json_string.replace('], "', '], @@')
    
    json_string = json_string.replace("['", '[@@')
    json_string = json_string.replace('["', '[@@')
    
    json_string = json_string.replace("']", '@@]')
    json_string = json_string.replace('"]', '@@]')
    
    json_string = json_string.replace('"', '')
    
    json_string = json_string.replace('@@', '"')
    json_string = json_string.replace('!', "'")
    json_string = json_string.replace('\\', '')
    
    return json_string
# Read CSV and ensure no empty values
def read_csv(file_path):
    data = []
    record = []
    csv.field_size_limit(10**9)
    max_cap = 2986504530116.944
    with open(file_path, mode='r', encoding='utf-8') as file:
        reader = csv.reader(file)
        count = 0
        for row in reader:
            if count == 0:
                count += 1
                continue
            print("read: ", count)
            if row[10]=='{}':
                continue
            pair = sorted((row[0], row[4]))
            if pair in record:
                continue
            count += 1
            record.append(pair)
            try:
                mutual_company1 = json.loads(fix_json_string(row[10]))  # Assuming the data is in JSON format in the CSV
                mutual_company2 = json.loads(fix_json_string(row[11]))  # Assuming the data is in JSON format in the CSV
                data.append((row[0], row[1], row[2], float(row[3])/max_cap, row[4], row[5], row[6], float(row[7])/max_cap, float(row[8]), int(row[9]), mutual_company1, mutual_company2, row[12]))
                
            except Exception as e:
                print(e)
                break
    return data

def main():
    try:
        # Connect to the PostgreSQL database using the full URL
        conn = psycopg2.connect(DATABASE_URL, sslmode='require')  # Use sslmode if required by Render
        print("Connected to the database.")
        
        # Create the table if it doesn't exist
        create_table(conn)

        # Read the CSV file and insert data
        for year in range(2021,2024,1):
            csv_file_path = f'output{year}-2.csv'  # Replace with your actual CSV file path
            data = read_csv(csv_file_path)

            if data:
                insert_data(conn, data, year)
            else:
                print("No valid data found in the CSV file.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn:
            conn.close()
            print("Connection closed.")

if __name__ == "__main__":
    main()
