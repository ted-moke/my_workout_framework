Check env variables app is using 
`docker compose exec app env | grep DB`

Query tables
`docker compose exec db psql -U workout -d workout_tracker -c "\dt"`

Try to query one container to another
`docker compose exec app wget -qO- http://localhost:3001/api/users 2>&1`