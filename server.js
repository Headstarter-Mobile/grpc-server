const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { Pool } = require('pg');
const userService = require('./services/user');
const companyService = require('./services/company');
const positionService = require('./services/position');

const USER_SERVICE_PROTO_PATH = __dirname + '/protos/user_service.proto';
const COMPANY_SERVICE_PROTO_PATH = __dirname + '/protos/company_service.proto';
const POSITION_SERVICE_PROTO_PATH = __dirname + '/protos/position_service.proto';

const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
};

const userPackageDefinition = protoLoader.loadSync(USER_SERVICE_PROTO_PATH, options);
const companyPackageDefinition = protoLoader.loadSync(COMPANY_SERVICE_PROTO_PATH, options);
const positionPackageDefinition = protoLoader.loadSync(POSITION_SERVICE_PROTO_PATH, options);

const userProto = grpc.loadPackageDefinition(userPackageDefinition).job_board;
const companyProto = grpc.loadPackageDefinition(companyPackageDefinition).job_board;
const positionProto = grpc.loadPackageDefinition(positionPackageDefinition).job_board;

// PostgreSQL Connection Pool
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'headstarter',
    password: '1234',
    port: 5432,
});

const server = new grpc.Server();

server.addService(userProto.UserService.service, {
    GetUser: userService.getUser(pool),
    CreateUser: userService.createUser(pool),
});

server.addService(companyProto.CompanyService.service, {
    GetCompany: companyService.getCompany(pool),
    CreateCompany: companyService.createCompany(pool),
});

server.addService(positionProto.PositionService.service, {
    GetPosition: positionService.getPosition(pool),
    CreatePosition: positionService.createPosition(pool),
    GetPositionsByCompany: positionService.getPositionsByCompany(pool),
});

server.bindAsync('0.0.0.0:5001', grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
        console.error('Server bind error:', err);
        return;
    }
    console.log(`Server running on port ${port}`);
    server.start();
});