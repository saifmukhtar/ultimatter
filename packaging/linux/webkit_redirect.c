#define _GNU_SOURCE
#include <stdio.h>
#include <dlfcn.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>
#include <spawn.h>

static int (*orig_execve)(const char *, char *const [], char *const []) = NULL;
static int (*orig_posix_spawn)(pid_t *, const char *, const posix_spawn_file_actions_t *,
                               const posix_spawnattr_t *, char *const [], char *const []) = NULL;

static const char *redirect(const char *path, char *buf, size_t sz) {
    if (path && access(path, X_OK) != 0 && strstr(path, "WebKit")) {
        const char *appdir = getenv("APPDIR");
        const char *fname = strrchr(path, '/');
        if (appdir && fname) {
            snprintf(buf, sz, "%s/usr/libexec/webkit2gtk-4.1%s", appdir, fname);
            if (access(buf, X_OK) == 0) return buf;
        }
    }
    return path;
}

int execve(const char *path, char *const argv[], char *const envp[]) {
    if (!orig_execve) orig_execve = dlsym(RTLD_NEXT, "execve");
    char buf[1024];
    return orig_execve(redirect(path, buf, sizeof(buf)), argv, envp);
}

int posix_spawn(pid_t *pid, const char *path, const posix_spawn_file_actions_t *fa,
                const posix_spawnattr_t *attr, char *const argv[], char *const envp[]) {
    if (!orig_posix_spawn) orig_posix_spawn = dlsym(RTLD_NEXT, "posix_spawn");
    char buf[1024];
    return orig_posix_spawn(pid, redirect(path, buf, sizeof(buf)), fa, attr, argv, envp);
}

int posix_spawnp(pid_t *pid, const char *path, const posix_spawn_file_actions_t *fa,
                 const posix_spawnattr_t *attr, char *const argv[], char *const envp[]) {
    return posix_spawn(pid, path, fa, attr, argv, envp);
}
