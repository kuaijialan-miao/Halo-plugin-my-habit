package com.miaohaha.habit.controller;

import com.miaohaha.habit.model.Pomodoro;
import com.miaohaha.habit.service.PomodoroService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.ApiVersion;

@ApiVersion("v1alpha1")
@RestController
@RequestMapping("/plugins/plugin-habit-tracker/api/pomodoros")
@RequiredArgsConstructor
public class PomodoroController {

    private final PomodoroService pomodoroService;

    @GetMapping
    public Mono<java.util.List<Pomodoro>> list() {
        return pomodoroService.listAll();
    }

    @PostMapping
    public Mono<Pomodoro> create(@RequestBody Pomodoro pomodoro) {
        return pomodoroService.create(pomodoro);
    }

    @PostMapping("/{name}/finish")
    public Mono<Pomodoro> finish(@PathVariable String name) {
        return pomodoroService.finish(name);
    }
}
