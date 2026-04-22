# GCP World Wide Map

Mapping the internet's topology using Google Cloud VMs across the globe

# Info

We can use traceroute to see the path that packets take to reach a destination
- Each hop in the traceroute has an IP address
- We can only traceroute from our machine
We can also use an ip-geolocator api to see where an IP is

By combining these two, we can map some of the internet's topology.
By using VMs in different regions, we can get a more complete picture of the internet's topology.

# Infrastructure

- We instantiate VMs in many regions in Google Cloud
- Each will run a code that traceroutes to a list of IPs
  - Each traceroute will normalize it and sent it to a "master" VM
- The master processes and store that data, and makes it available in a 'GET all' endpoint

We'll have a frontend that will fetch the data from the Master VM's api and display it
The frontend is the only part of this not hosted on GCP (it's in Github Pages)

# How to run

## Online

- Run 'terraform apply'
- Wait for the VMs to finish
- If you change backend code, run `terraform apply -replace="terraform_data.build_image"` to update the Cloud Run service.

You will get an api which gives a mesh of the internet's topology

Switch the hardcoded url in the frontend to your cloud_run url

## Local

Switch the hardcoded url in the frontend to `http://localhost:3000`

Postgre: `docker run -e POSTGRES_PASSWORD=Password123! -e POSTGRES_DB=mydb -p 5432:5432 -d postgres`
NestJS: `npm i` `npm run start:dev`
Frontend: `npm i` `npm run dev`

You can then run the traceroute file with `cd traceroutes && python3 traceroute_vm.py`
You can even have a friend join by just switching the url to your IP address (in case you have a static public ip, cloudflare tunnel or you guys are on tailscale)

# NOTES

Since i don't know how ip-geolocation deals with anycasted ip's, i won't differentiate them by region

This project is meant to show-off networking, not as a serious project. So if you wanna point out lack of auth, tests and how vibe-coded the thing is, fuck off

Each time you run 'terraform apply', the VMs will kick-in, traceroute, send the data to cloud_run. If cloud_run gets a new hop, it will write to the db. If it gets an existing one, it will update the ping and region if the ping is lower. It will NOT delete older hops. This was meant for a single "tracing run"