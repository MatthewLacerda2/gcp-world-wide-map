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
    ipLocations.forEach((il) => {
      locationMap.set(il.ip, il.location);
    });

    return {
      hops: hops.map((h) => {
        const origin_location = locationMap.get(h.origin) || null;
        const destination_location = locationMap.get(h.destination) || null;
        
        let ping = h.ping;
        if (origin_location && destination_location) {
          ping = this.clampPing(h.ping, origin_location, destination_location);
        }

        return {
          origin_ip: h.origin,
          origin_location,
          destination_ip: h.destination,
          destination_location,
          ping,
        };
      }),
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
        if (ip === 'localhost' || ip === 'unknown' || ip.startsWith('192.168.') || ip.startsWith('10.')) continue;

        const existingIpLoc = await this.ipLocationRepository.findOne({ where: { ip } });
        if (existingIpLoc) continue;

        const response = await fetch(`https://ipwhois.app/json/${ip}`);
        const data = await response.json();

        await this.fetchIpLocation(ip, data);
        
        // Respect rate limit of 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Geolocation error for ${ip}:`, error);
      }
    }
  }

  private async fetchIpLocation(ip: string, data: any) {
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
  }

  private clampPing(ping: number, origin: Location, destination: Location): number {
    const SPEED_OF_LIGHT_METERS = 299792458;
    const SPEED_MULTIPLIER = 3;

    const distanceMeters = this.calculateDistance(
      origin.latitude, origin.longitude,
      destination.latitude, destination.longitude
    );
    
    const minPing = (distanceMeters * SPEED_MULTIPLIER) / SPEED_OF_LIGHT_METERS * 1000;
    
    return Math.max(ping, minPing);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const EARTH_RADIUS_METERS = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return EARTH_RADIUS_METERS * c;
  }
}
