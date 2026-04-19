output "cloud_run_url" {
  value = google_cloud_run_v2_service.backend.uri
}

output "db_connection_name" {
  value = google_sql_database_instance.main.connection_name
}

output "traceroute_vm_ips" {
  value = {
    for k, v in google_compute_instance.traceroute_vms : k => v.network_interface[0].access_config[0].nat_ip
  }
}
