#!/usr/bin/perl

# useful resources:
# http://library.linode.com/databases/mysql/mysql-ssh-tunnel#sph_create-a-tunnel-with-mysql-tunnel-on-mac-os-x-or-linux
# http://www.craiglotter.co.za/2011/02/04/ubuntu-mysql-ssh-tunnel-via-the-terminal/

# MySQL Tunnel Tool for MacOS X and Linux
# Copyright (c) 2009 Linode, LLC
# Author: Philip C. Paradis <pparadis@linode.com>
# Usage: mysql-tunnel.pl [start|stop]
# Access a MySQL database server via an SSH tunnel.

$local_ip    = "127.0.0.1";
$local_port  = "3307";
$remote_ip   = "69.164.218.35";
$remote_port = "3306";
$remote_host = "poisson";

$a = shift;
$a =~ s/^\s+//;
$a =~ s/\s+$//;

$pid=`ps ax|grep ssh|grep $local_port|grep $remote_port`;
$pid =~ s/^\s+//;
@pids = split(/\n/,$pid);
foreach $pid (@pids)
{
 if ($pid =~ /ps ax/) { next; }
 split(/ /,$pid);
}

if (lc($a) eq "start")
{
 if ($_[0]) { print "Tunnel already running.\n"; exit 1; }
 else
 {
  system "/usr/bin/ssh -N -f -L $local_port:$local_ip:$remote_port $remote_host";
  exit 0;
 }
}
elsif (lc($a) eq "stop")
{
 if ($_[0]) { kill 9,$_[0]; exit 0; }
 else { exit 1; }
}
else
{
 print "Usage: mysql-tunnel.pl [start|stop]\n";
 exit 1;
}
