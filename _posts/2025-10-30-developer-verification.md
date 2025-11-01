---
layout: post
title: A theoretical way to circumvent Android developer verification
has_repo: true
repo_author: enaix
repo: apk-loader

image:
    path: assets/img/android-skull.jpg
    width: 780
    height: 451
---

<img src="/assets/img/android-skull.jpg" alt="android skull" class="img-hover">

As you all know, Google has introduced developer verification as a way to prevent users from installing "unregistered" APKs. This measure was taken as a security feature to link every APK in existence to its developer, as in Play Store.

[Link to the Android documentation](https://developer.android.com/developer-verification), [link to FAQ](https://developer.android.com/developer-verification/guides/faq)



## Why this is bad

This has already been discussed by [ArsTechnica](https://arstechnica.com/gadgets/2025/10/google-confirms-android-dev-verification-will-have-free-and-paid-tiers-no-public-list-of-devs/) and on some threads (some cherry-picked ones): [reddit](https://old.reddit.com/r/Android/comments/1nwddik/heres_how_androids_new_app_verification_rules/), [ycombinator](https://news.ycombinator.com/item?id=45017028), [hackaday](https://hackaday.com/2025/08/26/google-will-require-developer-verification-even-for-sideloading/).

A quick recap of the main points (as of 30 Oct 2025):

- The base tier costs $25, as in Play Market. Requires an ID
- There will be a limited "hobbyist" unpaid license. Google claims that they won't require an ID
- Legal info is told to be private, unlike with Play Market
- The verification code is supposed to be located in Play Services, **but Google hasn't published the source code yet**
- Google assures that it would be possible to install applications locally using ADB, **but there are no details on this**
- Hobbyist license restrictions are unknown

A few months prior Google has decided to [make Android development private](https://arstechnica.com/gadgets/2025/03/google-makes-android-development-private-will-continue-open-source-releases/), which seems to be a preparation for the upcoming changes ([another article](https://www.androidauthority.com/google-not-killing-aosp-3566882/)). Due to this change in AOSP release format, it is no longer possible to track what exactly Google is doing.

My answer to this question is that it would simply prevent small developers from distributing their apps, including myself. If we take the legal route, a hobbyist license is supposed to have some limit on the number of installs by design. If we take, say, 10K installs, this is not enough in my case. Another question is how exactly the process of verification is going to happen, what if Google adopts the same rules as in Play Store? Taking my [fork of the old VN engine port](https://github.com/enaix/Kirikiroid2-debloated), this apk would not pass security checks, as the old codebase relies on legacy external storage permissions, which are banned in Play Store. If we take the adb route, there are **no guarantees that this method is going to work in the future in the form you expect**. For instance, Google mentions that this method is meant for on-device tests during development, and nothing prevents them from reporting the install to their servers and checking if a self-signed apk has been installed on other devices. Another way to put it, this is problematic for an average Android user to perform these steps, and this is going to be the developer's problem.

The situation links pretty well with Samsung [removing bootloader unlocking with the One UI 8 update](https://www.sammobile.com/news/say-goodbye-to-your-custom-roms-as-one-ui-8-kills-bootloader-unlock/). Great, duh...

## The concept

![apk loader](/assets/img/loader1.svg)

My vision of the hack is to distribute a verified loader apk, which in turn dynamically loads any apk the user wants. A user obtains the loader apk once and loads apps without installing as much as they want.

The Java virtual machine in Android is the ART/Dalvik runtime (I will refer to it as Dalvik, it seems that Google hates cool names). Did you know that Dalvik natively [allows dynamic code execution using PathClassLoader](https://developer.android.com/reference/dalvik/system/PathClassLoader)? So an apk may just load some zip/apk/dex code from external storage and execute it in current context. Essentially, this means that we can natively load the apk into memory and execute any code inside of the target apk, and we are not altering the original code signature of the loader.

In order to actually run the apk, the loader needs to properly initialize the main activity (aka the main screen, or the entrypoint) of the target apk. So, the main activity needs to be initialized and somehow placed inside of the Android's activity cycle with the loader acting as a wrapper. Then, the loader apk should handle other aspects like local files handling and names conflict resolution. This can be achieved by patching the target apk bytecode: .odex/.dex classes may be dynamically decompiled into .smali, analyzed and compiled back into a modified apk. Furthermore, the loader would have to parse AndroidManifest options of the target (main activity location, screen options).

### Implementation

Developing such wrapper in a straightforward way has proven to be rather difficult, as Android [activity management logic](https://android.googlesource.com/platform/frameworks/base/+/master/core/java/android/app/Activity.java) is extremely complicated and differs from version to version. In short, it was problematic to perform the initialization process the right way. Some people suggested to avoid the initialization step completely, and use Unsafe Dalvik api to register the target's activity as the loader apk activity stub, which is declared in the loader's manifest without class. I couldn't find exact methods in the [Unsafe documentation](https://developer.android.com/reference/sun/misc/Unsafe), but this actually may be a way to go.

Due to this particular issue I couldn't bring the proof of concept to a working state in a reasonable time, and because of this I was considering to not publish this article at all. The purpose of this post is not to give a somewhat ready solution, but get some feedback on the concept, as I was not ready to devote lots of time on a potentially broken solution.


## The logistics

> **Information provided in this section is for educational use only, all scenarios discussed below are hypothetical.**

In order to install the loader apk on the device, it would require, well, some form of verification. Hobbyist license is the only choice here, as paying $25 for each attempt is not optimal. Since the hobbyist license has a limited number of installs, there should be multiple instances of the apk with separate licences. In this hypothetical scenario there may either be a pool of volunteers who sign the code, or completely random users who are willing to help. In the second case, the loader code would somehow need to be verified or scanned, since such distribution system would be vulnerable to malware.

The final and the most important issue in this process is the verification process itself, as the loader code may (and likely will) be flagged by Google. So, the code would require some form of obfuscation like code flow modification and implementing double functionality (for instance, registering it as a file manager). If Google decides to ban dynamic code loading altogether, the final solution would be to pack the Dalvik runtime into the loader as a native library. This of course would have extremely low performance, but it should be technically possible.

Overall, the hypothetical plan has lots of assumptions, with which I'm not happy with. First of all, it requires lots of manual work by the volunteers or random people, and this work also includes the apk obfuscation, which was not discussed in detail. Then, the verification process itself should be somewhat permissive to allow potentially suspicious apps (I would like to hear how does this happen with current Play Store verification).

## Conclusion

The project described in this article by no means is a finished solution, and if you have started to think what else could work, it means that the article has reached its original goal. I believe that we would eventually come up with a proper solution in the future. Thank you for reading!


You may find the source code [here](https://github.com/enaix/apk-loader). Feel free to create an issue if you wish to discuss

# Update 1

Linking the [ycombinator thread](https://news.ycombinator.com/item?id=45776269) here.

The most common reaction to this post was "why bother, there exists adb and Shinzuku".

## Why we should bother

We can only hope that Google allows to install distributed APKs over adb in the future, as they explicitly stated that they will allow this for developers to test **their own** APKs:

> As a developer, you are free to install apps without verification with ADB. This is designed to support developers' need to develop, test apps that are not intended or not yet ready to distribute to the wider consumer population

It is possible for them to do the following:

- Limit the number of installs of an unverified APK, limit it to a single device or go the Apple way (uninstall app after a time limit). This technically won't prevent developers from testing their apps
- Make it harder to unlock the developer options by requiring some kind of verification that you are a developer. This seems to be less likely, since it's quite tricky to implement.

There is no reason to dismiss this scenario, as it aligns with Google's recent actions against power users like making AOSP development private, not publishing Pixel device trees and irrationally trying to ban ad blockers on Youtube (though the last point is partially related to Android through Vanced). If the subset of users who utilize adb is going to be large enough (and it will be), what exactly is stopping them from doing something about it?

## Efficiency

Another opinion was that it is "not a good idea to try and find a technical solution to a people/organisation problem". Furthermore, if such solution is implemented, it is going to require too much effort to maintain, as each upload is going to be almost immediately banned by Google. I absolutely agree with both of these takes, since the apk loader developers are likely going to give up sooner or later.

In this post I've made a critical mistake of not putting the emphasis on the removal of bootloader unlock, since in fact it's indeed awful, as it makes people stuck with Google's restrictions in the first place. While the first move was done by Samsung, it's still very alarming as a precedent. Right now the situation with AOSP-based ROMs is not great, as you have to own a specific device like a Pixel or OnePlus model, and Google keeps messing with AOSP. The true hope here are root-based solutions, as they work on stock Android - I hope that they are not going to go anywhere in the future.

