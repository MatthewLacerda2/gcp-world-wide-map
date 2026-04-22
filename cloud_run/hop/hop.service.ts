import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import { CreateHopDto } from './dto/create-hop.dto';
import { Hop } from './entities/hop.entity';
import { IpLocation } from './entities/ip-location.entity';
import { Location } from './entities/location.entity';
import { calculateDistance, findGeozone, Geozone, MAX_LAND_HOP_DISTANCE_KM, SPEED_MULTIPLIER, SPEED_OF_LIGHT_METERS } from './hop.utils';

@Injectable()
export class HopService {
  private geozones: Geozone[] = [];

  constructor(
    @InjectRepository(Hop)
    private hopRepository: Repository<Hop>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(IpLocation)
    private ipLocationRepository: Repository<IpLocation>,
  ) {
    this.loadGeozones();
  }

  private loadGeozones() {
    try {
      const filePath = path.join(__dirname, 'geozones.json');
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        this.geozones = data.features.map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          polygon: f.geometry.coordinates[0],
        }));
        console.log(`Successfully loaded ${this.geozones.length} geozones.`);
      } else {
        console.warn(`Geozones file not found at: ${filePath}`);
      }
    } catch (e) {
      console.error('Failed to load geozones:', e);
    }
  }

  async findAll(): Promise<any> {
    const [hops, ipLocations] = await Promise.all([
      this.hopRepository.find(),
      this.ipLocationRepository.find({ relations: ['location'] }),
    ]);

    const locationMap = new Map<string, Location>();
    ipLocations.forEach((il) => {
      locationMap.set(il.ip, il.location);
    });

    const results = [];
    for (const h of hops) {
      const origin_location = locationMap.get(h.origin) || null;
      const destination_location = locationMap.get(h.destination) || null;
      
      const hopObj = {
        origin_ip: h.origin,
        origin_location,
        destination_ip: h.destination,
        destination_location,
        ping: h.ping,
        region: h.region,
      };

      if (this.isPossibleHop(hopObj)) {
        if (origin_location && destination_location) {
          hopObj.ping = this.clampPing(h.ping, origin_location, destination_location);
        }
        results.push(hopObj);
      } else {
        console.log(`Deleting impossible hop: ${h.origin} -> ${h.destination}`);
        await this.hopRepository.delete(h.id);
      }
    }

    return { hops: results };
  }

  private isPossibleHop(h: any): boolean {
    if (!h.origin_location || !h.destination_location) return true;

    const distanceMeters = calculateDistance(
      h.origin_location.latitude, h.origin_location.longitude,
      h.destination_location.latitude, h.destination_location.longitude
    );
    const distanceKm = distanceMeters / 1000;

    if (distanceKm <= MAX_LAND_HOP_DISTANCE_KM) return true;

    // Longer than 3000km, must be a known undersea cable / geozone
    const originZone = findGeozone(h.origin_location.latitude, h.origin_location.longitude, this.geozones);
    const destZone = findGeozone(h.destination_location.latitude, h.destination_location.longitude, this.geozones);

    // If both are in the same zone (e.g. North Atlantic), it's possible
    return originZone !== null && destZone !== null && originZone === destZone;
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
    const distanceMeters = calculateDistance(
      origin.latitude, origin.longitude,
      destination.latitude, destination.longitude
    );
    
    const minPing = (distanceMeters * SPEED_MULTIPLIER) / SPEED_OF_LIGHT_METERS * 1000;
    
    return Math.max(ping, minPing);
  }
}
