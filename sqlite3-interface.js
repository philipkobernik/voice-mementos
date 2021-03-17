const maxApi = require("max-api");
const sqlite = require("sqlite3");

var params = {
	"duration": 2.0,
	"rms": 0.2,
	"flatness": 0.1,
	"pitch": 60
};
const dbFilename = "corpus_755_energy_weighted.db";

const connectDb = (dbFilename) => {
	let _db = new sqlite.Database(`./${dbFilename}`, sqlite.OPEN_READONLY, (err) => {
  		if (err) {
    		maxApi.outlet(err.message);
			maxApi.outlet(`./${dbFilename}`);
  		} else {
  			maxApi.outlet(`Connected to ${dbFilename}`);
		}
	});
	
	return _db;
};

const demo = () => {
	
	let db = connectDb(dbFilename);

	maxApi.outlet("polybuffer clear");
	
	sql = `SELECT path FROM notes
				where pitchConfidence > 0.95
				order by pitch ASC;`;
	
	db.serialize(() => {
	  db.each(sql, (err, row) => {
	    if (err) {
	    	maxApi.outlet(err.message);
	    } else {
	    	maxApi.outlet("load", row.path);
		}
	  });
	});
	db.close();

};

maxApi.addHandler("setParam", (paramName, value) => {
	params[paramName] = value;
	
	//maxApi.outlet(params);
});

maxApi.addHandler("generate", () => {
	
	let db = connectDb(dbFilename);

	maxApi.outlet("polybuffer", "clear");
	
	let whereClause = `where pitch > ${params["pitch"]-50}
				and pitch < ${params["pitch"]+50}
				and durationSeconds > ${params["duration"]}
				and rms > ${params["rms"]-0.00008}
				and rms < ${params["rms"]+0.00008}
				and flatness > ${params["flatness"]-0.025}
				and flatness < ${params["flatness"]+0.025}
				order by pitch ASC;`;
	
	let selectStatement = `SELECT path FROM notes ` + whereClause;
				
	let countStatement = `SELECT COUNT(*) FROM notes ` + whereClause;
				
				
	maxApi.outlet(selectStatement);
	
	db.serialize(() => {
		db.get(countStatement, (err, row) => {
			if (err) {
		    	maxApi.outlet("error", err.message);
		    } else {
		    	maxApi.outlet("resultCount", row["COUNT(*)"]);
			}
		});
		db.each(selectStatement, (err, row) => {
			if (err) {
				maxApi.outlet("error", err.message);
			} else {
				maxApi.outlet("load", row.path);
			}
		});
	});
	db.close();
});