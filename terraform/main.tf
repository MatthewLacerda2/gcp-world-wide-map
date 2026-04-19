# Resource for the PostgreSQL database (Cloud SQL)
resource "google_sql_database_instance" "main" {
  name             = "world-wide-map-db"
  database_version = "POSTGRES_16s"
  region           = var.region

  settings {
    tier = "db-f1-micro"
  }
}

# Placeholder for Cloud Run service (the NestJS app)
resource "google_cloud_run_v2_service" "backend" {
  name     = "world-wide-map-backend"
  location = var.region

  template {
    containers {
      image = "gcr.io/${var.project_id}/world-wide-map-backend:latest"
    }
  }
}

# Example of loop to create VMs in multiple regions for traceroute
resource "google_compute_instance" "traceroute_vms" {
  for_each     = toset(var.traceroute_regions)
  name         = "traceroute-${each.key}"
  machine_type = "f1-micro"
  zone         = "${each.key}-a"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
    }
  }

  network_interface {
    network = "default"
    access_config {}
  }

  metadata_startup_script = "python3 /path/to/traceroute_vm.py --region ${each.key}"
}
