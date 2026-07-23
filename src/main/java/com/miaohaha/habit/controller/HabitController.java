package com.miaohaha.habit.controller;

import com.miaohaha.habit.model.Habit;
import com.miaohaha.habit.service.HabitService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.ApiVersion;

@ApiVersion("v1alpha1")
@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
public class HabitController {

    private final HabitService habitService;

    @GetMapping
    public Mono<java.util.List<Habit>> list() {
        return habitService.listAll();
    }

    @GetMapping("/{name}")
    public Mono<Habit> get(@PathVariable String name) {
        return habitService.getByName(name);
    }

    @PostMapping
    public Mono<Habit> create(@RequestBody Habit habit) {
        return habitService.create(habit);
    }

    @PutMapping("/{name}")
    public Mono<Habit> update(@PathVariable String name, @RequestBody Habit habit) {
        return habitService.update(name, habit);
    }

    @DeleteMapping("/{name}")
    public Mono<Void> delete(@PathVariable String name) {
        return habitService.delete(name).then();
    }
}
