# SURF: A System to Unveil Explainable Risk Relations between Firms

This repository contains the codebase for the [SURF demo website](https://surf-firm-risk-relations.onrender.com/), accompanying the NAACL 2025 demo paper:  
**[SURF: A System to Unveil Explainable Risk Relations between Firms](https://aclanthology.org/2025.naacl-demo.22/)**.

A [tutorial video](https://www.youtube.com/watch?v=HobCyNgR9T0) is also available on YouTube.

---

## Requirements

- **Node.js** version **v20.11.0** (please ensure your environment matches this version)

---

## Repository Structure

- **backend/**  
  Contains the API for the frontend, implemented with Express.js (not FastAPI). The backend is responsible for querying and serving data from PostgreSQL.

- **showroom/**  
  Contains the frontend implementation for the demo website. The UI is divided into three main components:
  - `SettingsPanel.js`: Settings and controls (left panel)
  - `NetworkGraph.js`: Interactive network visualization (center)
  - `RelationInfoPanel.js`: Detailed relation information (right panel)
- **insertdata_postgre.py**  
  A Python script for inserting data into the PostgreSQL database. Use this script to populate your database with the required data before running the backend server.
---

## Getting Started

1. **Install dependencies**

   For the backend:
   ```sh
   cd backend
   npm install
   ```

   For the frontend:
   ```sh
   cd showroom
   npm install
   ```

2. **Configure your database**

   Update the PostgreSQL connection string in `backend/server.js` and `insertdata_postgre.py` with your actual credentials.

3. **Run the backend server**

   ```sh
   cd backend
   node server.js
   ```

4. **Run the frontend**

   ```sh
   cd showroom
   npm start
   ```

   The frontend will be available at [http://localhost:3000](http://localhost:3000).

---

## Notes

- This repository is an example implementation for the demo website described in the paper.
- For more details, refer to the documentation in each subdirectory.

---

## Resources

- [Paper (ACL Anthology)](https://aclanthology.org/2025.naacl-demo.22/)
- [Demo Website](https://surf-firm-risk-relations.onrender.com/)
- [Tutorial Video](https://www.youtube.com/watch?v=HobCyNgR9T0)

---