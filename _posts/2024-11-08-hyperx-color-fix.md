---
layout: post
title: Fixing HyperX RGB DRAM color glitch
has_repo: true
repo_author: enaix
repo: hyperx-dram-color-fix
image:
    path: assets/img/rgb_banner.jpg
    width: 1300
    height: 787
---

![trinity rig rgb](/assets/img/rgb_banner.jpg)

#### WIP!!!

Due to my new research project, I had to upgrade my rig for the first time - it was built back in 2020 and needed some enchancements. Firstly, I've replaced a dying SSD, then swapped Ryzen 5 3600 with a beefier Ryzen 7 5700x. The old cooler couldn't effectively cool down the new CPU in precision boost mode, so I also had to swap out both the cooler and pc case. Finally, I've mixed 2 new 16 GB HyperX Fury ram sticks with the old 2x8 HyperX Predator ones. Luckily, the sticks booted up just fine (I even managed to overclock them to 3200 GHz 15-17-17), but there was a weird issue: **blue channel on the old sticks was dim**. This didn't only happen in `OpenRGB`, but also in stock rainbow mode

## The problem

Since the sticks show this dimming issue in all modes, that's the incompatibility issue between old and new HyperX RGB controllers. To understand how this works, we need to understand how does the software communicate to the ram sticks.

#### Controlling DRAM RGB

![dram i2c chart](/assets/img/dram_i2c-1.svg)

HyperX ram is controlled on address `0x27` using global commands that control all of the rgb sticks. This means that the sticks should have some communication protocol. 

Each ram stick has `SPD` controller, which has 3 additional pins `SA0`-`SA2` in order to determine the slot. Only one common pin (`ACT_n`, `VDDSPD`) is directly connected to the bus, so in order to select each particular chip, `Device Type Identifier Code` prefix should be appended to the i2c command. It means that we can directly access each SPD controller on address range `0x30 - 0x37`

Let's analyze available addresses using `i2cdetect <device-number>` (you can get device list using `i2cdetect -l`):

```
I will probe file /dev/i2c-9.
I will probe address range 0x08-0x77.
Continue? [Y/n] y
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f
00:                         08 -- -- -- 0c -- -- -- 
10: -- -- -- -- -- 15 -- -- -- -- -- -- -- -- -- -- 
20: -- -- -- -- -- -- -- 27 -- -- -- -- -- -- -- -- 
30: 30 31 -- -- 34 35 -- -- -- -- -- -- -- -- -- -- 
40: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 4f 
50: 50 51 52 53 -- -- -- -- -- -- -- -- -- -- -- -- 
60: -- -- -- -- -- -- -- -- 68 -- -- -- -- -- -- -- 
70: -- -- -- -- -- -- -- -- 
```

As we see, `0x27` address is used for HyperX RGB API, but here we found an another address range `0x30 - 0x31` and `0x34 - 0x35`, which *theoretically* can be used for read operations. Write operations are likely disabled.

Right here we are going to apply color correction to mitigate the dimming effect


## I2C Commands

Most of the job has been done by OpenRGB developers: they managed to reverse-engineer HyperX protocol. The list of commands can be found here: [OpenRGB Documentation](https://gitlab.com/OpenRGBDevelopers/OpenRGB-Wiki/-/blob/stable/Device-Documentation/HyperX-Predator-RGB.md)

All messages are sent using the format `Packet start -> List of commands -> Packet end -> Apply`

Firstly, we need to set the mode (it's global for all sticks):

```bash
i2cset -y $I2C_DEV $ADDR 0xe1 0x01 # Start of message
i2cset -y $I2C_DEV $ADDR 0xe5 0x21 # Mode Control 3, selected mode : Direct
i2cset -y $I2C_DEV $ADDR 0xe1 0x02 # End of message
i2cset -y $I2C_DEV $ADDR 0xe1 0x03 # Apply
```

We have selected Direct per-led mode, so we can set each led individually. Here comes the hard part: we need to convert each slot and led position to i2c write command with "address". It's not a physical i2c address, but rather an internal mapping in HyperX protocol.

```bash
get_rgb_index() {
        # Get hex address of each led from zone 0..3, led 0..4 and channel 0..2
        IND="0x$(printf '%X' $((0x11+$1*0x30+$2*3+$3)))"
}

get_bri_index() {
        # Get hex address of brightness for led from zone 0..3 and led 0..4
        IND="0x$(printf '%X' $((0x21+0x30*$1+$2*3)))"
}
```

Luckily, the formula is pretty simple: if we iterate over `0x11 - 0x1f` range, we will get all channels for the first slot in repeating `R-G-B R-G-B R-G-B` pattern. Brightness is set in the next 5 commands for each led. Beginning of each zone is spaced each `0x30` commands. The protocol supports up to 4 slots 


## Color correction

We need to apply two color corrections: for the blue channel and for red and green channels separately. We can match the brightness of blue channel between the zones and then correct the brightness of other channels - essentially, we are going to adjust the white balance.

Correction for the blue channel can be done simply by multiplying it by some constant.

R,G channels correction is trickier: we need to map them from `0-0xff` to `0-dim_coeff*blue_ratio`, where `blue_ratio` is the inversed brightness of blue channel after correction. Using this formula, we can set all zones to full brightness if blue channel is set to 0 and limit them to the brightness of the blue channel if it's equal to `0xff`.

```bash
color_corr() {
        # Color correction for R and G channels, arguments: color, blue_corr
        CORR_INT=$(( ((0x3F - $2 + $COLOR_CORR_MAX) * $1) / 0xFF ))
        # (b_min*(c_max-c)+b_max(c-c_min))/(c_max-c_min)
        if [[ $CORR_INT -lt 0 ]]; then COL="0x00"
        else
                if [[ $CORR_INT -gt 255 ]]; then COL="0xFF"
                else COL=0x"$(printf '%X' $CORR_INT)"
                fi
        fi
}
```

Theoretically, a simple `lerp` may not be the best solution for color correction, so this formula may need to be replaced with some smoothing function like a bezier curve.

## Running the script

Before running the script, make sure that the `i2c-tools` package is installed and `ee1004` module is unloaded.

Don't forget to set `I2C_DEV` to the device address (may be found in OpenRGB device properties and using `i2cdetect -l`)

Simply clone the repository and run `hyperx_ram_rgb.sh` script

The first parameter is the hex code of the color (`#ffffff`), and the second one is the brightness (you may set it to `0xff`)

## OpenRGB Plugin

WIP!

## Links

HyperX i2c commands (OpenRGB): [OpenRGB Documentation](https://gitlab.com/OpenRGBDevelopers/OpenRGB-Wiki/-/blob/stable/Device-Documentation/HyperX-Predator-RGB.md)

SPD Wikipedia article: [https://en.wikipedia.org/wiki/Serial_presence_detect](https://en.wikipedia.org/wiki/Serial_presence_detect)

DDR4 SDRAM Datasheet: [https://docs.rs-online.com/6ecf/0900766b81641250.pdf](https://docs.rs-online.com/6ecf/0900766b81641250.pdf)

