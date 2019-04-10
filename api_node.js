// const http = require('http');
const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors');
const app = express()

// CORS
app.use(cors());
app.options('*', cors());

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

app.listen(3000, () => {
    console.log('listening on port 3000...')
});

const {
    Pool
} = require('pg')
const db = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'geodb',
    password: '1234',
    port: 5432,
})

app.get('/', (req, res) => {
    res.send('node api');
});

// get all
app.get('/api/house', (req, res) => {
    const sql = 'SELECT * FROM house_samutsongkram';
    db.query(sql).then((data) => {
        res.status(200).json(data.rows)
    })
});

// get one
app.get('/api/house/:id', (req, res) => {
    const id = req.params.id;
    const sql = `SELECT * FROM house_samutsongkram where house_id = ${id}`;
    db.query(sql).then((data) => {
        res.status(200).json(data.rows)
    })
});

// post
app.post('/api/user', (req, res) => {
    const {
        name,
        email
    } = req.body;

    // const sql = `INSERT INTO users (username, email)VALUES('${name}', '${email}')`;
    const sql = `SELECT * from house_samutsongkram WHERE firstname = '${name}'`;

    db.query(sql)
        .then((data) => {
            res.status(200).json(data.rows)
            // res.status(200).json({
            //     status: 'success',
            //     message: 'retrived list'
            // });
        })
});

// put
app.put('/api/user', (req, res) => {
    const {
        id,
        name,
        email
    } = req.body;

    const sql = `UPDATE users SET username='${name}', email='${email}' WHERE gid=${id}`;

    db.query(sql)
        .then(() => {
            res.status(200).json({
                status: 'success',
                message: 'retrived list'
            });
        })
});

// delete
app.delete('/api/user/:id', (req, res) => {
    const id = req.params.id;

    const sql = `DELETE FROM users WHERE gid = ${id}`;

    db.query(sql)
        .then(() => {
            res.status(200).json({
                status: 'success',
                message: 'retrived list'
            });
        })
});

// distance api 
app.get('/api/hosp_distance/:firstname', (req, res) => {
    let fname = req.params.firstname

    const sql = `SELECT a.firstname, b.name, 
    ST_Distance(ST_Transform(a.geom, 32647), ST_Transform(b.geom, 32647)) as dist
    FROM house a, hospital b
    WHERE a.firstname = '${fname}'`;

    db.query(sql)
        .then((data) => {
            res.status(200).json(data.rows);
        })
});

// D_Within
app.get('/api/find_poi/:gid/:dist', (req, res) => {
    let gid = req.params.gid;
    let dist = req.params.dist;
    const sql = `SELECT p.fclass, p.name, p.geom
    FROM poi p
    WHERE ST_DWithin(ST_Transform(p.geom, 32647),
					 (SELECT ST_Transform(geom, 32647) as geom 
					  	FROM road WHERE gid = ${gid}),
					 ${dist})`;

    db.query(sql)
        .then((data) => {
            res.status(200).json(data.rows);
        })
});


// get all household geojson
app.get('/api/hh', (req, res) => {
    const sql = 'SELECT *, st_x(geom) as lon, st_y(geom) as lat  FROM house_samutsongkram';
    let jsonFeatures = [];
    db.query(sql).then((data) => {
        var rows = data.rows;
        rows.forEach((e) => {
            let feature = {
                type: 'Feature',
                properties: e,
                geometry: {
                    type: 'Point',
                    coordinates: [e.lon, e.lat]
                }
            };
            jsonFeatures.push(feature);
        });
        let geoJson = {
            type: 'FeatureCollection',
            features: jsonFeatures
        };
        res.status(200).json(geoJson);
    })
})

// select by circle
app.get('/api/hh/:lat/:lon/:buff', (req, res) => {
    const lat = req.params.lat;
    const lon = req.params.lon;
    const buff = req.params.buff;
    const sql = `SELECT *, st_x(geom) as lon, st_y(geom) as lat  
                FROM house_samutsongkram
                WHERE ST_DWithin(ST_Transform(geom,32647), ST_Transform(ST_GeomFromText('POINT(${lon} ${lat})',4326), 32647), ${buff}) = 'true'`;
    let jsonFeatures = [];
    db.query(sql).then((data) => {
        var rows = data.rows;
        rows.forEach((e) => {
            let feature = {
                type: 'Feature',
                properties: e,
                geometry: {
                    type: 'Point',
                    coordinates: [e.lon, e.lat]
                }
            };
            jsonFeatures.push(feature);
        });
        let geoJson = {
            type: 'FeatureCollection',
            features: jsonFeatures
        };
        res.status(200).json(geoJson);
    })
});

// select by draw
app.post('/api/hh_by_draw', (req, res) => {
    const {
        geom
    } = req.body;

    const sql = `SELECT *, st_x(geom) as lon, st_y(geom) as lat  
    FROM house_samutsongkram
    WHERE st_contains(
    st_SetSRID(
        st_geomfromgeojson('${geom}'),
        4326),
        geom
    ) = 'true'`;

    let jsonFeatures = [];
    db.query(sql).then((data) => {
        var rows = data.rows;
        rows.forEach((e) => {
            let feature = {
                type: 'Feature',
                properties: e,
                geometry: {
                    type: 'Point',
                    coordinates: [e.lon, e.lat]
                }
            };
            jsonFeatures.push(feature);
        });
        let geoJson = {
            type: 'FeatureCollection',
            features: jsonFeatures
        };
        res.status(200).json(geoJson);
    })
});


// insert feature
app.post('/api/insertfeature', (req, res) => {
    const {
        name_t,
        geom,
        type
    } = req.body;

    const sql = `INSERT INTO feature (name_t, geom, type_g) VALUES ( 
        '${name_t}', ST_SetSRID(st_geomfromgeojson('${geom}'), 4326), '${type}')`;

    db.query(sql)
        .then(() => {
            res.status(200).json({
                status: 'success',
                message: 'retrived list'
            });
        })
});

// update feature
app.post('/api/updatefeature', (req, res) => {
    const {
        name_t,
        geom
    } = req.body;

    const sql = `UPDATE feature 
                SET geom=ST_SetSRID(st_geomfromgeojson('${geom}'), 4326) 
                WHERE name_t='${name_t}'`;

    db.query(sql)
        .then(() => {
            res.status(200).json({
                status: 'success',
                message: 'retrived list'
            });
        })
});

// delete feature
app.post('/api/deletefeature', (req, res) => {
    const {
        name_t
    } = req.body;

    const sql = `DELETE FROM feature WHERE name_t='${name_t}'`;

    db.query(sql)
        .then(() => {
            res.status(200).json({
                status: 'success',
                message: 'retrived list'
            });
        })
});

// get feature
app.get('/api/getfeature', (req, res) => {
    const sql = `SELECT jsonb_build_object(
        'type',     'FeatureCollection',
        'features', jsonb_agg(feature)
    )
    FROM (
      SELECT jsonb_build_object(
        'type',       'Feature',
        'id',         gid,
        'geometry',   ST_AsGeoJSON(geom)::jsonb,
        'properties', to_jsonb(row) - 'gid' - 'geom'
      ) AS feature
      FROM (SELECT * FROM feature) row) features`;

    db.query(sql).then((data) => {
        res.status(200).json(data.rows[0].jsonb_build_object)
    })
});

// update value
app.post('/api/updatevalue', (req, res) => {
    const {
        name_t,
        desc_t
    } = req.body;

    const sql = `UPDATE feature 
                SET desc_t='${desc_t}' 
                WHERE name_t='${name_t}'`;

    db.query(sql)
        .then(() => {
            res.status(200).json({
                status: 'success',
                message: 'retrived list'
            });
        })
});

app.get('/api/house/:id', (req, res) => {
    const id = req.params.id;
    const sql = `SELECT * FROM house_samutsongkram where house_id = ${id}`;
    db.query(sql).then((data) => {
        res.status(200).json(data.rows)
    })
});

// get poi
app.get('/api/getpoi', (req, res) => {
    const sql = `SELECT name, fclass, ST_X(geom) as lon, ST_Y(geom) as lat FROM poi WHERE name IS NOT NULL`;
    db.query(sql)
        .then((data) => {
            res.status(200).json(data.rows);
        })
})