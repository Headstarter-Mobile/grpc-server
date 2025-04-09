const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { Pool } = require('pg');

const applicationService = require('./services/application');
const authTokenService = require('./services/auth_token');
const companyService = require('./services/company');
const notificationService = require('./services/notification');
const officeService = require('./services/office');
const positionService = require('./services/position');
const userService = require('./services/user');

const APPLICATION_SERVICE_PROTO_PATH = __dirname + '/protos/service_application.proto';
const AUTH_TOKEN_SERVICE_PROTO_PATH = __dirname + '/protos/service_auth_token.proto';
const COMPANY_SERVICE_PROTO_PATH = __dirname + '/protos/service_company.proto';
const NOTIFICATION_SERVICE_PROTO_PATH = __dirname + '/protos/service_notification.proto';
const OFFICE_SERVICE_PROTO_PATH = __dirname + '/protos/service_office.proto';
const POSITION_SERVICE_PROTO_PATH = __dirname + '/protos/service_position.proto';
const USER_SERVICE_PROTO_PATH = __dirname + '/protos/service_user.proto';

const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
};

const applicationPackageDefinition = protoLoader.loadSync(APPLICATION_SERVICE_PROTO_PATH, options);
const authTokenPackageDefinition = protoLoader.loadSync(AUTH_TOKEN_SERVICE_PROTO_PATH, options);
const companyPackageDefinition = protoLoader.loadSync(COMPANY_SERVICE_PROTO_PATH, options);
const notificationPackageDefinition = protoLoader.loadSync(NOTIFICATION_SERVICE_PROTO_PATH, options);
const officePackageDefinition = protoLoader.loadSync(OFFICE_SERVICE_PROTO_PATH, options);
const positionPackageDefinition = protoLoader.loadSync(POSITION_SERVICE_PROTO_PATH, options);
const userPackageDefinition = protoLoader.loadSync(USER_SERVICE_PROTO_PATH, options);

const applicationProto = grpc.loadPackageDefinition(applicationPackageDefinition).application;
const authTokenProto = grpc.loadPackageDefinition(authTokenPackageDefinition).auth_token;
const companyProto = grpc.loadPackageDefinition(companyPackageDefinition).company;
const notificationProto = grpc.loadPackageDefinition(notificationPackageDefinition).notification;
const officeProto = grpc.loadPackageDefinition(officePackageDefinition).office;
const positionProto = grpc.loadPackageDefinition(positionPackageDefinition).position;
const userProto = grpc.loadPackageDefinition(userPackageDefinition).user;

// PostgreSQL Connection Pool
const pool = new Pool({
    user: 'postgres', // Replace with your PostgreSQL user
    host: 'localhost', // Replace with your PostgreSQL host
    database: 'headstarter', // Replace with your PostgreSQL database name
    password: '1234', // Replace with your PostgreSQL password
    port: 5432, // Replace with your PostgreSQL port
});

const server = new grpc.Server();

server.addService(applicationProto.ApplicationService.service, {
    GetApplication: applicationService.getApplication(pool),
    GetAllApplications: applicationService.getAllApplications(pool),
    CreateApplication: applicationService.createApplication(pool),
    UpdateApplication: applicationService.updateApplication(pool),
    DeleteApplication: applicationService.deleteApplication(pool),
});

server.addService(authTokenProto.AuthTokenService.service, {
    GenerateToken: authTokenService.generateToken(pool),
    VerifyToken: authTokenService.verifyToken(pool),
    InvalidateToken: authTokenService.invalidateToken(pool),
});

server.addService(companyProto.CompanyService.service, {
    GetCompany: companyService.getCompany(pool),
    GetAllCompanies: companyService.getAllCompanies(pool),
    CreateCompany: companyService.createCompany(pool),
    UpdateCompany: companyService.updateCompany(pool),
    DeleteCompany: companyService.deleteCompany(pool),
});

server.addService(notificationProto.NotificationService.service, {
    GetUnseenMessages: notificationService.getUnseenMessages(pool),
    MarkAsRead: notificationService.markAsRead(pool),
    createNotification: notificationService.createNotification(pool),
});

server.addService(officeProto.OfficeService.service, {
    GetOffice: officeService.getOffice(pool),
    GetAllOffices: officeService.getAllOffices(pool),
    CreateOffice: officeService.createOffice(pool),
    UpdateOffice: officeService.updateOffice(pool),
    DeleteOffice: officeService.deleteOffice(pool),
});

server.addService(positionProto.PositionService.service, {
    GetPosition: positionService.getPosition(pool),
    GetAllPositions: positionService.getAllPositions(pool),
    CreatePosition: positionService.createPosition(pool),
    UpdatePosition: positionService.updatePosition(pool),
    DeletePosition: positionService.deletePosition(pool),
});

server.addService(userProto.UserService.service, {
    GetUser: userService.getUser(pool),
    GetAllUsers: userService.getAllUsers(pool),
    CreateUser: userService.createUser(pool),
    LoginUser: userService.loginUser(pool),
    UpdateUser: userService.updateUser(pool),
    DeleteUser: userService.deleteUser(pool),
});

server.bindAsync('0.0.0.0:5001', grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
        console.error('Server bind error:', err);
        return;
    }
    console.log(`Server running on port ${port}`);
    server.start();
});
