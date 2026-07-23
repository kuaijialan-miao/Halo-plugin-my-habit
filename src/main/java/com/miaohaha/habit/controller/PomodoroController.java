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
@RequestMapping("/api/pomodoros")
@RequiredArgsConstructor
public class PomodoroController {

    private final PomodoroService pomodoroService;

    @GetMapping
    public Mono<java.util.List<Pomodoro>> list() {
        return pomodoroService.listAll();
    }

    @GetMapping("/today-stats")
    public Mono<Map<String, Object>> todayStats() {
        return pomodoroService.listFocusToday()
            .map(list -> {
                int count = list.size();
                int totalMinutes = list.stream()
                    .mapToInt(p -> {
                        var spec = p.getSpec();
                        if (spec.getDuration() != null) {
                            return spec.getDuration() / 60;
                        }
                        // fallback: 用 endTime - startTime 估算
                        if (spec.getStartTime() != null && spec.getEndTime() != null) {
                            return (int) java.time.Duration.between(spec.getStartTime(), spec.getEndTime()).toMinutes();
                        }
                        return 25; // 默认 25 分钟
                    })
                    .sum();
                return Map.of("focusCount", count, "totalFocusMinutes", totalMinutes);
            });
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
