---
layout: post
title: Selfhosted cloud gaming using steam link
date:   2023-03-04 12:21:13 +0300
calegories: linux networking
---

Recently I have found myself in a classical situation with a powerful rig at home, while using an ultrabook 90% of the time. This piece of hardware cannot even run *TF2* due to problematic 10-th gen i3 processor that goes full throttle (4 GHz) at idle. So, I've decided to try setting up home vpn and playing/working remotely on the desktop PC.

## How this works

![image cloud_gaming_graph](/assets/img/01_graph01.png)

### Network

As you see, the remote client connects to the *wireguard* server hosted on the *Raspberry PI*. It is possible to host it on the main rig, but it would be impossible to send the magic packet in case if the rig is turned off.

It is recommended to buy a *static IP* from the provider for better user experience (and I'm sure that you don't want to randomly lose access due to the router rebooting and changing dynamic ip address). If it is not an option and your router is accessible from outside (there is no double NAT), you may use a [telegram bot](https://github.com/enaix/tg-remote-ssh) or a *dynDNS* service to get the ip.

If you are under *double nat*, then there is not much of a choice: forwarding services like Ngrok or localhost.run provide miserable speed. Selfhosted vps with an ssh tunnel may get you somewhere, but it still heavily limits your connection speed. From my experience, paying for a static ip is the best choice.

### Streaming

*Steam Remote Play* is by far the best option in terms of speed and quality. Any remote desktop solutions like *VNC* or *nomachine* have different video encoding algorithms and have miserable framerate. If you are using Windows, you may give *Moonlight* a try. Also, Steam has magnificant input system that supports any input. I was surprised that it even supports Samsung physical keyboards on Android!

### Installation

I won't cover *wireguard* installation process, since there are dozens of guides online ([one](https://davidshomelab.com/access-your-home-network-from-anywhere-with-wireguard-vpn/) [two](https://linuxize.com/post/how-to-set-up-wireguard-vpn-on-ubuntu-20-04/)). I also recommend to setup an SSH server and VNC/Nomachine on your home PC to be able to launch Steam if the system reboots. You also need to enable *Remote Play* in Steam settings and install *Steam Link* client on your laptop/tablet.

## Does it work, right?

Right after buying static ip from my provider and setting up the vpn, I finally see the remote screen and... it crashes after a minute. Furthermore, Steam client on the rig crashes alongside with Steam Link, which is extremely weird. It allows me to play any game, but it always dies after a minute or two.

On the next day I noticed that my home router is inaccessible. The router started to randomly drop the link (requiring a reboot each time), the problem was that it could not handle the load. So yeah, an old router may have problems with a static ip.

As for the Steam client, the root of the problem was in the commit in Xorg that ended up breaking some obscure software including Remote Play. It was considered to be non-critical, so why it took so long for the dev team to revert the commit.

Fast-forward in 2 months: it was either the Xorg team or a recent Remote Play update that fixed the issue!

## Test results

720p, reasonable FPS (I get around 40-60 I guess) on 10 mbps home link (gigabit ethernet at home) + 100 mbps local wifi with not-so-bad delay. Not gonna lie, you would have troubles playing competitive shooters, but it is enough to play almost any game you wish.

If you add a non-steam game (for example a Lutris launcher), you can also run pretty much any program you wish.

Overall, I recommend this solution for those who don't wish to pay for cloud gaming solutions or want to stream games with minimal latency.