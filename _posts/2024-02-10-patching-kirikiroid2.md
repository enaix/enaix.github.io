---
layout: post
title: Patching chinese adware from Kirikiroid2 apk
categories: decompilation smali
has_repo: true
repo_author: enaix
repo: Kirikiroid2-debloated
image:
    path: assets/img/spy_shawk.png
    height: 900
    width: 583
---

![spy shawk](/assets/img/spy_shawk.png)

[Kirikiroid2](https://github.com/zeas2/Kirikiroid2) is an awesome opensource Kirikiri engine emulator for android, but there is a problem: the provided apk on Github is different from the one that *could* be built from source. While the source code is perfectly fine, the apk contains `Android.Waps` adware. The problem is that recompiling the source is problematic due to the lack of certain source files and dependency issues. [Kirikiroid2Yuri](https://github.com/YuriSizuku/Kirikiroid2Yuri) project attempts to solve this issue, but the rebuilt apk is still in beta. The author also published a tweaked version of the original apk, which will also be patched.

You may find APK files at [Github](https://github.com/enaix/Kirikiroid2-debloated)


### Note: the apk has also been patched to run on Android 14!


## Overview

There are 2 available files: original `Kirikiroid2_1.3.9.apk` and patched `Kirikiroid2_yuri_1.3.9.apk`. We will be covering only the first one, because the differences are minimal.

In order to decompile the apk, we are using [Apktool](https://github.com/iBotPeaches/Apktool). This utility unpacks the .apk file and converts the `.dex`/`.odex` files into readable `smali` code. `.dex` file is the bytecode for the Dalvik/ART virtual machine that is used in Android. Google doesn't use original Java virtual machine due to cpu and memory limitations on mobile, which is quite reasonable. You can think of `.dex` code as some kind of assembler that is executed on a interpreter rather than hardware. Reading opcodes is not practical, so why we need to convert them to some human readable format: `smali`. It's similar to disassembling binary files into readable assembler.

Note that I'm not an Android/Java developer and have no prior experience in modifying apk files. It's better to read [intro to Smali](https://payatu.com/blog/an-introduction-to-smali/) first, scroll down to find more links on app decompilation.

## Tools

* Java Development Kit (JDK)
* [Apktool](https://github.com/iBotPeaches/Apktool)
* Some text editor or IDE (I'm using Intellij IDEA with smali plugin)
* (Optional) Android sdk for apk optimization 

## Decompilation

Note: replace the apk name with either `Kirikiroid2_yuri_1.3.9.apk` if needed.

In order to decompile the apk, we need to run `apktool`:

`java -jar apktool_2.9.3.jar d Kirikiroid2_1.3.9.apk -o kiri2_src/`

`cd kiri2_src`

```
AndroidManifest.xml assets              original            smali
apktool.yml         lib                 res
```

Now we have the project ready. The project structure consists of manifest file (main apk options), assets and resources (assets, lib, res, original), apktool config (no need to modify) and smali files. Java class hierarchy is preserved, such that class `a.b.c` is stored in `smali/a/b/c.smali`.

### Project structure

```
smali
├── a
│   └── un.smali
├── android     # Android comon libraries
│   ├── net
│   └── support
├── b
│   └── a
├── cn
│   └── waps    # Adware that we need to purge
├── com         # Some libraries
│   ├── android
│   ├── enhance
│   └── loopj
└── org         # 3 libraries and kirikiri2 sources
    ├── apache
    ├── cocos2dx
    ├── libsdl
    └── tvp     # Main source code
```

From here we can see that the main task is to remove all usages of `cn.waps.*` from `org.tvp.*` classes and just remove the `cn` folder altogether. Theoretically, we could take another approach and modify `cn.waps` functions to the point where it's harmless, but that would be quite hard.

Let's take a look at `org/tvp/` sources:

```
smali/org/tvp
├── kirikiri2
│   ├── DummyEdit.smali
│   ├── KR2Activity$1.smali
│   ├── KR2Activity$2.smali
│   ├── KR2Activity$3.smali
│   ├── KR2Activity$4.smali
│   ├── KR2Activity$5.smali
│   ├── KR2Activity$6.smali
│   ├── KR2Activity$7.smali
│   ├── KR2Activity$DialogMessage$1.smali
│   ├── KR2Activity$DialogMessage$2.smali
│   ├── KR2Activity$DialogMessage$3.smali
│   ├── KR2Activity$DialogMessage$4.smali
│   ├── KR2Activity$DialogMessage.smali
│   ├── KR2Activity$KR2GLSurfaceView.smali
│   ├── KR2Activity$ShowTextInputTask.smali
│   ├── KR2Activity.smali    # <-
│   ├── MediaStoreHack.smali
│   ├── MediaStoreUtil.smali
│   └── SDLInputConnection.smali
└── kirikiri2_free_10309
    ├── BuildConfig.smali
    ├── Kirikiroid2.smali    # <-
    ├── R$attr.smali
    ├── R$dimen.smali
    ├── R$drawable.smali
    ├── R$integer.smali
    ├── R$raw.smali
    ├── R$string.smali
    └── R.smali
```

Here the main source files are `Kirikiroid2.smali` and `KR2Activity.smali`. Actually, it would be interesting to analyze other files aswell, but the post would be way too long.

### Analyzing Kirikiroid2 source code

By using `Find in files` -> `waps` I've checked that the adware is only called from `Kirikiroid2.smali` file.

The first function that uses `cn.waps` is handleMessage.

```
.method public handleMessage(Landroid/os/Message;)V
    .locals 6
    .param p1, "msg"    # Landroid/os/Message;

    .prologue
    const/4 v3, 0x1

    .line 91
    iget v4, p1, Landroid/os/Message;->what:I

    const v5, 0x10001

    if-ne v4, v5, :cond_2

    .line 92
    iget v3, p1, Landroid/os/Message;->arg1:I

    if-eqz v3, :cond_1

    .line 93    # <- 93
    invoke-static {p0}, Lcn/waps/AppConnect;->getInstance(Landroid/content/Context;)Lcn/waps/AppConnect;

    move-result-object v3

    # <- next line
    invoke-virtual {v3, p0}, Lcn/waps/AppConnect;->showPopAd(Landroid/content/Context;)V
    
    # ...

    goto :goto_0
.end method
```

If we check the beginning of the function, we can see that this method takes `android/os/Message` and returns `V` - `void` type. Let's analyze line 93:

`invoke-static {p0}` means that we are calling a static method, while passing a register `p0`.

`Lcn/waps/AppConnect;` calls the AppConnect class and `->getInstance(Landroid/content/Context;)Lcn/waps/AppConnect` mentions the exact method to call. So this line gets the instance of the adware class to work with.

The next line calls a virtual method `showPopAd`. It seems that this adware has builtin code to display ads, huh..

Since this function is not present in the original source code and is redefined in some other parts of the project, it's likely that the author made it to be quickly addable and removable. In other words, we can simply remove this function and the app would compile.

Other functions `.method public onCreate(Landroid/os/Bundle;)V`, `.method public onDestroy()V` and `.method showBannerAd(Z)V` act the same and can be safely removed.

`onDestroy` is likely to be a destructor, we should double check it to avoid memory leaks:

```
.method public onDestroy()V
    .locals 1  # we use 1 local register

    .prologue  # for debug
    .line 80
    invoke-static {p0}, Lcn/waps/AppConnect;->getInstance(Landroid/content/Context;)Lcn/waps/AppConnect;

    move-result-object v0

    invoke-virtual {v0}, Lcn/waps/AppConnect;->close()V

    .line 81
    return-void
.end method
```

Here we use 1 local register v0 (the VM needs to know how many of them to reserve)

We pass first argument `p0` to `getInstance` in order to get the current adware instance, then assign the result to `v0` register and call `close` in order to stop the instance.

If we take a look at the [published source file](https://github.com/zeas2/Kirikiroid2/blob/master/project/android/src/org/tvp/kirikiri2/Kirikiroid2.java), we see that the method may look something like that:

```java

@Override
public void onDestroy()
{
    AppConnect instance = getInstance(this);
    instance.close();
}
```

We may also remove this function, because no adware instance is being created.

At this point we may delete the `cn` directory, since there are no other mentions in the project.

### Final modifications

I have found another concerning function that I would like to patch: `KR2Activity.smali:1206`

```
.method public static getDeviceId()Ljava/lang/String;
    .locals 5

    .prologue
    .line 272
    invoke-static {}, Lorg/tvp/kirikiri2/KR2Activity;->GetInstance()Lorg/tvp/kirikiri2/KR2Activity;

    move-result-object v3

    const-string v4, "phone"

    # ...

    goto :goto_0
.end method
```

This one obtains the device id, which is usually used for advertising purposes, it makes sense to return zeros. Here the functions returns `java/lang/String`, so we may just return "0000000000000000".

We may just append
```
const-string v0, "0000000000000000"
return-object v0
```
after `.line 272` directive and the function would return early.

## Recompilation

Run `cd ..` to exit the `kiri2_src` directory and run

`java -jar apktool_2.9.3.jar b kiri2_src`

to rebuild the project. Next we would need to sign the apk with our own certificate:

Generate the signing key if needed (once):

`keytool -genkey -v -keystore <filename>.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias <alias>`

Sign the apk:

`jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore <path-to-key> ./kiri2_src/dist/Kirikiroid2_1.3.9.apk <alias>`

We may optionally call zipalign to optimize the apk file:

`/path/to/android-sdk/bin/build-tools/*/zipalign -p -f -v 4 kiri2_src/dist/Kirikiroid2_1.3.9.apk kiri2_src/dist/Kirikiroid2_1.3.9_debloated.apk`

## Results

We have obtained the apk file that runs and is not flagged on virustotal, unlike the original ones. I've changed the application name in apktool.yml file in order to avoid the package name conflict. If the original apk crashes, please use yuri version with bugfixes.

**APK and project files are available at [Github](https://github.com/enaix/Kirikiroid2-debloated)**

Unfortunately, analyzing the adware code is beyond the scope of this article, since it's obfuscated, but I may try doing that later.

## Links

Intro to smali: [https://payatu.com/blog/an-introduction-to-smali/](https://payatu.com/blog/an-introduction-to-smali/)

Essential info on smali (multiple links in the top answer): [Stackoverflow question](https://stackoverflow.com/questions/5656804/whats-the-best-way-to-learn-smali-and-how-when-to-use-dalvik-vm-opcodes)

Smali cheatsheet, not quite readable: [github gist](https://gist.github.com/AadilGillani/8c5690ebbaceda2914f9dc37197bd154)