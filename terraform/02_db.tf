# 4. PostgreSQL DB (Cloud SQL)
resource "google_sql_database_instance" "main" {
  project          = google_project.map_project.project_id
  name             = "gc-www-map"
  database_version = "POSTGRES_17"
  region           = var.region

  settings {
    tier = "db-f1-micro"
    edition = "ENTERPRISE"
    
    availability_type = "ZONAL"

    disk_type = "PD_HDD"
    disk_size = 10
    disk_autoresize = false

    backup_configuration {
      enabled            = false
      transaction_log_retention_days = 1
    }

    ip_configuration {
      ipv4_enabled = true
    }
  }

  root_password = "Password123!"

  deletion_protection = false
}

resource "google_sql_database" "database" {
  name     = "mydb"
  instance = google_sql_database_instance.main.name
  project  = google_project.map_project.project_id
}
