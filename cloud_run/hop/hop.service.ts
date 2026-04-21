import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateHopDto } from './dto/create-hop.dto';
import { Hop } from './entities/hop.entity';
import { IpLocation } from './entities/ip-location.entity';
import { Location } from './entities/location.entity';

@Injectable()
export class HopService {
  constructor(
    @InjectRepository(Hop)
    private hopRepository: Repository<Hop>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(IpLocation)
    private ipLocationRepository: Repository<IpLocation>,
  ) {}

  async findAll(): Promise<any> {
    const [hops, ipLocations] = await Promise.all([
      this.hopRepository.find(),
      this.ipLocationRepository.find({ relations: ['location'] }),
    ]);

    // Create a map for quick lookup: ip -> location
    const locationMap = new Map<string, Location>();
    console.log(`Found ${ipLocations.length} IP locations:`, ipLocations.map(il => `${il.ip} -> ${il.location?.city}`));
    ipLocations.forEach((il) => {
      locationMap.set(il.ip, il.location);
    });

    return {
      hops: hops.map((h) => ({
        origin_ip: h.origin,
        origin_location: locationMap.get(h.origin) || null,
        destination_ip: h.destination,
        destination_location: locationMap.get(h.destination) || null,
        ping: h.ping,
      })),
    };
  }

  async createMany(createHopDto: CreateHopDto): Promise<void> {
    const { hops, region } = createHopDto;
    
    for (const h of hops) {
      const existing = await this.hopRepository.findOne({
        where: { origin: h.origin, destination: h.destination },
      });

      if (existing) {
        if (h.ping < existing.ping) {
          existing.ping = h.ping;
          existing.region = region;
          await this.hopRepository.save(existing);
        }
      } else {
        const hop = new Hop();
        hop.origin = h.origin;
        hop.destination = h.destination;
        hop.ping = h.ping;
        hop.region = region;
        await this.hopRepository.save(hop);
      }
    }

    // Trigger geolocation resolution for all unique IPs in background
    const ips = new Set<string>();
    hops.forEach(h => {
      ips.add(h.origin);
      ips.add(h.destination);
    });
    this.resolveGeolocations(Array.from(ips));
  }

  private async resolveGeolocations(ips: string[]) {
    for (const ip of ips) {
      try {
        if (ip === 'localhost' || ip === 'unknown') continue;

        const existingIpLoc = await this.ipLocationRepository.findOne({ where: { ip } });
        if (existingIpLoc) continue;

        const response = await fetch(`https://ipwhois.app/json/${ip}`);
        const data = await response.json();

        if (data && data.success) {
          const { latitude, longitude, city, region, country } = data;
          
          let location = await this.locationRepository.findOne({
            where: { latitude, longitude }
          });

          if (!location) {
            location = this.locationRepository.create({
              latitude, longitude, city, region, country
            });
            await this.locationRepository.save(location);
          }

          await this.ipLocationRepository.save({
            ip,
            locationId: location.id
          });
        }
      } catch (error) {
        console.error(`Geolocation error for ${ip}:`, error);
      }
    }
  }
}
