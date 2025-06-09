<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>
docker-compose -f docker-compose.yml up -d
cd api-gateway
yarn start:dev
cd auth-service
yarn start:dev
docker-compose -f docker-compose-nginx.yml up -d
