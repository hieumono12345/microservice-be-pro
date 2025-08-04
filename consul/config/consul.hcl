datacenter = "dc1"
server = true
ui = true
client_addr = "0.0.0.0"

verify_incoming = false
verify_outgoing = false

ports {
  https     = 8500
  http      = -1
  grpc      = -1
  grpc_tls  = -1
}


key_file   = "/consul/certs/consul.key"
cert_file  = "/consul/certs/consul.crt"
ca_file    = "/consul/certs/ca.crt"
