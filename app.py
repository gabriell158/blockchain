from flask import Flask, request, redirect, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from json import loads, dumps
from datetime import datetime
from random import random, uniform

app = Flask(__name__)
app.debug = True
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///blockchain.db'

db = SQLAlchemy(app)

migrate = Migrate(app, db)

class Validators(db.Model):
    id = db.Column(db.Integer, primary_key=True, unique=True, nullable=False)

    name = db.Column(db.String(100), unique=False, nullable=False)

    stake = db.Column(db.Float, unique=False, nullable=False)

    createdAt = db.Column(db.Integer, unique=False, nullable=False)

    def __repr__(self):
        return f"id:{self.id},name:{self.name},stake:{self.stake},createdAt:{self.createdAt}"

@app.route('/')
def home():
    return 'Listar opções'

@app.route('/validator', methods=["GET", "POST"])
def create():
    if (request.method == "GET"):
        validators = Validators.query.all()
        res = []
        for v in validators:
            v = v.__dict__
            v.pop('_sa_instance_state')
            res.append(v)
        return {"data": res}
    elif (request.method == "POST"):
        body = loads(request.data.decode() if request.data else b'{}')
        name = body.get("name")
        stake = body.get("stake")
        if name and stake:
            book = Validators(name=name, stake=stake, createdAt=datetime.now())
            db.session.add(book)
            db.session.commit()
            return "Criado com sucesso"

        else:
            return "name and stake are required"
    else:
        return f'Method {request.method} not allowed'

@app.route('/validator/<int:id>', methods=["GET", "PUT", "DELETE"])
def validator(id):
    if request.method == "GET":
        validator = Validators.query.get(id)
        if validator:
            validator = validator.__dict__
            validator.pop('_sa_instance_state')
            return validator
        else:
            return "Validator not found"

    elif request.method == "PUT":
        body = loads(request.data.decode() if request.data else b'{}')
        name = body.get("name")
        stake = body.get("stake")
        validator = Validators.query.get(id)
        if validator:
            validator.name = name if name else validator.name
            validator.stake = stake if stake else validator.stake
            db.session.commit()

            return "Atualizado com sucesso"
        else:
            return "Validador não encontrado"

    elif request.method == "DELETE":
        validator = Validators.query.get(id)
        db.session.delete(validator)
        db.session.commit()
        return "Validador apagado com sucesso"

    else:
        return f'Method {request.method} not allowed'

@app.route('/validate/<string:hash>', methods=['GET'])
def validate(hash):
    validators = Validators.query.all()
    sum = 0
    for v in validators:
        sum += v.stake
    value = uniform(0, sum)
    sum = 0
    elected = ""
    for v in validators:
        if value > v.stake + sum:
            sum += v.stake
        else:
            elected = v.name
            break
    valid = True if random() > 0.5 else False

    return {"data": {"elected": elected, "valid": valid}}

@app.route('/<string:page>')
def error(page):
    return f'Pagina { page } não existe'

app.run()