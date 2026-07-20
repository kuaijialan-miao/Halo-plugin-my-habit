package com.miaohaha.habit.controller;

import com.miaohaha.habit.model.Task;
import com.miaohaha.habit.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.ApiVersion;

@ApiVersion("v1alpha1")
@RestController
@RequestMapping("/plugins/plugin-habit-tracker/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public Mono<java.util.List<Task>> list() {
        return taskService.listAll();
    }

    @GetMapping("/{name}")
    public Mono<Task> get(@PathVariable String name) {
        return taskService.getByName(name);
    }

    @PostMapping
    public Mono<Task> create(@RequestBody Task task) {
        return taskService.create(task);
    }

    @PutMapping("/{name}")
    public Mono<Task> update(@PathVariable String name, @RequestBody Task task) {
        return taskService.update(name, task);
    }

    @DeleteMapping("/{name}")
    public Mono<Void> delete(@PathVariable String name) {
        return taskService.delete(name).then();
    }

    @PostMapping("/{name}/pomodoro")
    public Mono<Task> incrementPomodoro(@PathVariable String name) {
        return taskService.incrementPomodoro(name);
    }
}
