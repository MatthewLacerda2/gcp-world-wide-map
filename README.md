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