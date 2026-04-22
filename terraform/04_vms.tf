# 4. Traceroute VMs (The "Suicide Squad")
# These VMs start, run the traceroute, and then shut themselves down.

locals {
  # We read the script and inject the Cloud Run URL dynamically
  orig_script = file("${path.module}/../traceroutes/traceroute_vm.py")
  
  # Replace the hardcoded URL in the script with the actual Cloud Run URI from Terraform
  final_script = replace(
    local.orig_script,
    "https://world-wide-map-backend-494720044321.us-central1.run.app/api/traceroutes",
    "${google_cloud_run_v2_service.backend.uri}/api/traceroutes"
  )
  
  targets_content = file("${path.module}/../traceroutes/targets.json")
}

resource "google_compute_instance" "traceroute_vm" {
  for_each = toset(var.traceroute_regions)

  project      = google_project.map_project.project_id
  name         = "traceroute-node-${each.key}"
  machine_type = "e2-micro" # Cheapest modern machine
  zone         = "${each.key}-b"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 10 # Minimum 10GB disk
    }
  }

  network_interface {
    network = "default"
    access_config {
      # Standard ephemeral IP
    }
  }

  # This is the "brain" of the VM. It runs on boot.
  metadata_startup_script = <<-EOT
    #!/bin/bash
    apt-get update
    apt-get install -y traceroute python3-requests python3-pip
    
    mkdir -p /opt/traceroute
    cd /opt/traceroute
    
    # Create the targets file
    cat <<'EOF' > targets.json
    ${local.targets_content}
    EOF
    
    # Create the python script
    cat <<'EOF' > traceroute_vm.py
    ${local.final_script}
    EOF
    
    # Run the script!
    python3 -u traceroute_vm.py --region ${each.key}
    
    # SELF DESTRUCT (Shut down to stop billing)
    sudo poweroff
  EOT

  # Ensure the project APIs and Cloud Run are ready before we spawn the fleet
  depends_on = [google_project_service.enabled_apis, google_cloud_run_v2_service.backend]
}
