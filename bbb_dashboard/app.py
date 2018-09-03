import pandas as pd
import numpy as np
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import plotly.plotly as py
import plotly.graph_objs as go
import sqlalchemy
from sqlalchemy import create_engine, MetaData, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Numeric, Text, Float
from sqlalchemy.sql import text
from sqlalchemy.orm import Session
from sqlalchemy.ext.automap import automap_base
from flask import Flask, jsonify, render_template, request, redirect, url_for
import json
from datetime import datetime as dt
from dateutil.parser import parse
from flask_sqlalchemy import SQLAlchemy


	
#################################################
# Flask Setup
#################################################
app = Flask(__name__)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


#################################################
# Database Setup
#################################################
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', '') or "sqlite:///belly_button_biodiversity.sqlite"
db = SQLAlchemy(app)
engine = create_engine("sqlite:///belly_button_biodiversity.sqlite", pool_recycle=3600)

db.reflect()
db.Model = automap_base()
db.Model.prepare(db.engine, reflect=True)

# Base = automap_base()
# Base.classes.keys()
# Base.prepare(engine, reflect=True)

inspector = inspect(db.engine)
inspector.get_table_names()
inspector.get_columns("otu")
inspector.get_columns("samples_metadata")
inspector.get_columns("samples")

class OTU(db.Model):
    __tablename__ = "otu"
    __table_args__ = {"extend_existing":True}
    otu_id = Column(Text, primary_key=True)


class Samples(db.Model):
    __tablename__ = "samples"
    __table_args__ = {"extend_existing":True}
    otu_id = Column(Text,primary_key=True)

class Samples_Metadata(db.Model):
    __tablename__ = "samples_metadata"
    __table_args__ = {"extend_existing":True}
    SAMPLEID = Column(Text,primary_key=True)

session = Session(db.engine)
conn = engine.connect()	

# Create database tables
@app.before_first_request
def setup():
    db.create_all()	
	
	
#################################################
# Flask Routes
#################################################
@app.route("/")
def home():
	 # """Render Home Page"""
	return render_template("index.html")


@app.route("/charts1")
def tables():
	 # """Render Sample Tables page"""
	return render_template("charts1.html")


@app.route("/charts2")
def charts():
	 # """Render Sample Charts Page"""
	return render_template("charts2.html")


@app.route("/names")
def sample_names():
    names = inspector.get_columns('samples')
    df = pd.DataFrame(names, columns=['name'])
    df.columns = ['sample_name']
    sample_names_df = df.iloc[1:]
    names_list = sample_names_df['sample_name'].tolist()
    return jsonify(names_list)


@app.route('/otu')
def otu_describe():
    sql = "select * from OTU"
    df = pd.read_sql(sql, engine)
    df_arr = df.lowest_taxonomic_unit_found.unique()
    descriptions = df_arr.tolist()
    return jsonify(descriptions)


@app.route('/metadata/<sample>')
def samp_meta(sample):
    s = sample.replace("BB_","")
    sqlquery = (r'select AGE, BBTYPE, ETHNICITY, GENDER, LOCATION, SAMPLEID from Samples_Metadata where SAMPLEID = "' + s + r'"')
    for row in conn.engine.execute(sqlquery):
        results = dict(row)
    return jsonify(results)


@app.route('/samples/<sample>')
def samples(sample):
    sqlquery = (r'select * from Samples')
    datadetail = []
    for row in conn.engine.execute(sqlquery): 
        datadetail.append(dict(row))
    df = pd.DataFrame(datadetail)
    df = df[df[sample] > 1]
    df = df.sort_values(by=sample, ascending=0)
    results = [{
		"otu_ids": df[sample].index.values.tolist(),
		"sample_values": df[sample].values.tolist()
    }]
    return jsonify(results)


@app.route('/wfreq/<sample>')
def wfreq(sample):
	s = sample.replace("BB_","")
	sql = 'select WFREQ from Samples_Metadata where SAMPLEID = ' + s
	df = pd.read_sql_query(sql, engine)
	freq_dict = df.to_dict(orient='list')
	results = freq_dict['WFREQ']
	return jsonify(results)


if __name__ == '__main__':
    app.run(debug=True)
