# VaccineMY 101 Firebase Cloud Functions

## Tech Stack:
- Cloud Firestore
  - Storing vaccination statistics data
- Cloud Storage
  - Use to trigger auto import for vaccination centre data
- Cloud Functions
  - Serverless environment running express API server

## Setup Guide:

### Step 1: Clone This Repository

### Step 2: Rename your firebase project name in .firebaserc

### Step 3: Change directory into functions, where all the serverless functions code live in and install all node packages

```bash
cd functions && yarn run dev
```

### Step 4: Setup the runtime config
Generate a random API key that will be used for crawl endpoint.
```bash
cp .runtimeconfig.example.json .runtimeconfig.json
```

```json
{
  "server": {
    "cronjob_key": "<your-random-key>"
  }
}
```

### Step 5: Deploy to firebase using firebase-cli



## Trigger Auto import data for vaccination centre
To do this all you need to do is upload a file named as `centre.json` into your firebase cloud storage, it will start a trigger on data import transaction.
```json
[
    {
        "st": "Johor",
        "dist": "Kota Tinggi",
        "ppvc": "KK Bandar Penawar",
        "cd": "johor",
        "lat": "1.55332",
        "lon": "104.23373",
        "linky": ""
    },
    ...
]
```

##  API Docs


### Crawl API
The crawl API mostly called by your server such as a cronjob or manually. This API will start to request data from JKJAV and store those vaccination statistics to cloud firestore as statistics collection
```http
POST http://localhost:5001/vaccinemy-101/asia-southeast2/vaccineMY101api/crawl
```


| Headers | Content |
|:--|:--|
| Authorization | Bearer `<your-key-that-set-in-runtimeconfig.json>`

Response
```json
{
  "result": "done",
  "message": "17 state statistic records imported"
}
```

### Statistics

```http
GET http://localhost:5001/vaccinemy-101/asia-southeast2/vaccineMY101api/statistics
```

Response
```json
{
  "data": [
    {
      "regtotal": 1586153,
      "vakdosecomplete": 251726,
      "vakdose1": 251726,
      "pop_18": 2838600,
      "nme": "Johor",
      "vakdose2": 113171
    },
    {
      "regtotal": 720319,
      "vakdose1": 182683,
      "vakdose2": 75299,
      "pop_18": 1599200,
      "nme": "Kedah",
      "vakdosecomplete": 182683
    },
    {
      "vakdosecomplete": 137088,
      "vakdose2": 61769,
      "regtotal": 464531,
      "vakdose1": 137088,
      "pop_18": 1231800,
      "nme": "Kelantan"
    },
    {
      "pop_18": 24259200,
      "regtotal": 12799802,
      "vakdose2": 1220939,
      "vakdosecomplete": 2724048,
      "vakdose1": 2724048,
      "nme": "Malaysia"
    },
    {
      "vakdose2": 36972,
      "vakdose1": 69227,
      "vakdosecomplete": 69227,
      "pop_18": 701000,
      "nme": "Melaka",
      "regtotal": 398204
    },
    {
      "regtotal": 500784,
      "vakdose1": 96517,
      "vakdosecomplete": 96517,
      "pop_18": 849400,
      "vakdose2": 61508,
      "nme": "Negeri Sembilan"
    },
    {
      "nme": "Pahang",
      "vakdose2": 83339,
      "vakdosecomplete": 135641,
      "regtotal": 545204,
      "vakdose1": 135641,
      "pop_18": 1231800
    },
    {
      "regtotal": 908201,
      "vakdosecomplete": 216548,
      "vakdose2": 110610,
      "nme": "Perak",
      "vakdose1": 216548,
      "pop_18": 1933800
    },
    {
      "nme": "Perlis",
      "pop_18": 188200,
      "vakdose2": 20745,
      "vakdose1": 40557,
      "vakdosecomplete": 40557,
      "regtotal": 91344
    },
    {
      "regtotal": 837831,
      "pop_18": 1384600,
      "nme": "Pulau Pinang",
      "vakdosecomplete": 128945,
      "vakdose2": 74919,
      "vakdose1": 128945
    },
    {
      "vakdose2": 98910,
      "regtotal": 586927,
      "vakdose1": 204076,
      "pop_18": 2932700,
      "vakdosecomplete": 204076,
      "nme": "Sabah"
    },
    {
      "regtotal": 1257079,
      "pop_18": 2072000,
      "nme": "Sarawak",
      "vakdosecomplete": 261225,
      "vakdose2": 128648,
      "vakdose1": 261225
    },
    {
      "regtotal": 3370403,
      "vakdose2": 157671,
      "vakdose1": 398733,
      "pop_18": 4844000,
      "nme": "Selangor",
      "vakdosecomplete": 398733
    },
    {
      "regtotal": 369662,
      "nme": "Terengganu",
      "vakdosecomplete": 92264,
      "pop_18": 841800,
      "vakdose1": 92264,
      "vakdose2": 56344
    },
    {
      "vakdose1": 463878,
      "regtotal": 1052012,
      "vakdosecomplete": 463878,
      "pop_18": 1481000,
      "nme": "W.P. Kuala Lumpur",
      "vakdose2": 113466
    },
    {
      "pop_18": 72400,
      "regtotal": 42319,
      "vakdosecomplete": 16498,
      "vakdose2": 13136,
      "vakdose1": 16498,
      "nme": "W.P. Labuan"
    },
    {
      "vakdosecomplete": 28442,
      "vakdose1": 28442,
      "vakdose2": 14432,
      "nme": "W.P. Putrajaya",
      "regtotal": 68829,
      "pop_18": 56900
    }
  ],
  "updated": 1623254340000
}
```

### Statistics By State

```http
GET http://localhost:5001/vaccinemy-101/asia-southeast2/vaccineMY101api/statistics/:state
```

Request Params
state: "The state name in lowercase"

Response
```json
{
  "status": 200,
  "message": "success",
  "data": {
    "regtotal": 1586153,
    "vakdose2": 113171,
    "nme": "Johor",
    "vakdose1": 251726,
    "vakdosecomplete": 251726,
    "pop_18": 2838600
  }
}
```

### Vaccination Centre 

```http
GET http://localhost:5001/vaccinemy-101/asia-southeast2/vaccineMY101api/vaccination-centre
```

Response
```json
{
  "status": 200,
  "message": "success",
  "data": [
    {
      "state": "johor",
      "state_fullname": "Johor",
      "total_vaccination_locations": 26
    },
    {
      "state": "kedah",
      "state_fullname": "Kedah",
      "total_vaccination_locations": 21
    },
    {
      "state": "kelantan",
      "state_fullname": "Kelantan",
      "total_vaccination_locations": 31
    },
    {
      "state": "labuan",
      "state_fullname": "W.P. Labuan",
      "total_vaccination_locations": 3
    },
    {
      "state": "melaka",
      "state_fullname": "Melaka",
      "total_vaccination_locations": 10
    },
    {
      "state": "negerisembilan",
      "state_fullname": "Negeri Sembilan",
      "total_vaccination_locations": 47
    },
    {
      "state": "pahang",
      "state_fullname": "Pahang",
      "total_vaccination_locations": 53
    },
    {
      "state": "penang",
      "state_fullname": "Pulau Pinang",
      "total_vaccination_locations": 11
    },
    {
      "state": "perak",
      "state_fullname": "Perak",
      "total_vaccination_locations": 27
    },
    {
      "state": "perlis",
      "state_fullname": "Perlis",
      "total_vaccination_locations": 2
    },
    {
      "state": "sabah",
      "state_fullname": "Sabah",
      "total_vaccination_locations": 29
    },
    {
      "state": "sarawak",
      "state_fullname": "Sarawak",
      "total_vaccination_locations": 71
    },
    {
      "state": "selangor",
      "state_fullname": "Selangor",
      "total_vaccination_locations": 28
    },
    {
      "state": "terengganu",
      "state_fullname": "Terengganu",
      "total_vaccination_locations": 14
    },
    {
      "state": "wpkualalumpur",
      "state_fullname": "W.P. Kuala Lumpur",
      "total_vaccination_locations": 5
    },
    {
      "state": "wpputrajaya",
      "state_fullname": "W.P. Putrajaya",
      "total_vaccination_locations": 3
    }
  ]
}
```



### Vaccination Centre by state

```http
GET http://localhost:5001/vaccinemy-101/asia-southeast2/vaccineMY101api/vaccination-centre/:state
```

Request Params
state: "The state name in lowercase"

Response
```json
{
  "status": 200,
  "message": "success",
  "data": [
    {
      "st": "Johor",
      "cd": "johor",
      "dist": "Kota Tinggi",
      "lon": "103.90124",
      "ppvc": "Dewan Jubli Intan Kota Tinggi",
      "linky": "",
      "lat": "1.73618"
    },
    {
      "st": "Johor",
      "cd": "johor",
      "dist": "Mersing",
      "lon": "",
      "ppvc": "Hospital Mersing",
      "linky": "",
      "lat": ""
    },
    ...]
}
```
