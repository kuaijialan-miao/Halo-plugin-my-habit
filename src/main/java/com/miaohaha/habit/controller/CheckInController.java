package com.miaohaha.habit.controller;

import com.miaohaha.habit.model.CheckIn;
import com.miaohaha.habit.service.CheckInService;
import java.time.LocalDate;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.ApiVersion;

@ApiVersion("v1alpha1")
@RestController
@RequestMapping("/plugins/plugin-habit-tracker/api/checkins")
@RequiredArgsConstructor
public class CheckInController {

    private final CheckInService checkInService;

    @GetMapping
    public Mono<java.util.List<CheckIn>> list(@RequestParam(defaultValue = "") String habit) {
        if (!habit.isBlank()) {
            return checkInService.listByHabit(habit);
        }
        return checkInService.listByDate(LocalDate.now());
    }

    @PostMapping
    public Mono<CheckIn> create(@RequestBody CheckIn checkIn) {
        return checkInService.create(checkIn);
    }

    @DeleteMapping("/{name}")
    public Mono<Void> delete(@PathVariable String name) {
        return checkInService.delete(name).then();
    }

    @GetMapping("/streak")
    public Mono<Map<String, Object>> streak(@RequestParam String habit) {
        return checkInService.calculateStreak(habit)
            .map(s -> Map.<String, Object>of("habit", habit, "streak", s));
    }
}
