const os = require('os');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { execSync, exec, execFileSync } = require('child_process');
const { 
  CONFIG_DIR, 
  LOCAL_CERT_FILE, 
  LOCAL_KEY_FILE, 
  SETTINGS_FILE, 
  getTailscaleCertFiles 
} = require('./config');


module.exports = {
  AGENT_TARGETS,
  getLocalIp,
  getLocalIpv6,
  getLocalDomain,
  setLocalDomain,
  getDisabledAgents,
  setAgentEnabled,
  getAllowTailscale,
  setAllowTailscale,
  getTailscaleDns,
  getTailscaleState,
  generateTailscaleCert,
  generateSSLCertificate,
  getMkcertBinary,
  getRootCaPath,
  probeTargetPort,
  checkPortIsIde,
  getProcListeningPorts,
  getLinuxSocketFingerprint,
  findAllActiveAgentTargets,
  findActiveAgentTarget,
  findActiveIdePort,
  watchIdePort,};
