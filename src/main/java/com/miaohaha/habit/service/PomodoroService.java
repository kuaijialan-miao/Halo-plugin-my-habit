package com.miaohaha.habit.service;

import com.miaohaha.habit.model.Pomodoro;
import com.miaohaha.habit.model.Pomodoro.PomodoroMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import run.halo.app.extension.ReactiveExtensionClient;

@Service
@RequiredArgsConstructor
public class PomodoroService {

    private final ReactiveExtensionClient client;

    public Mono<List<Pomodoro>> listAll() {
        return client.list(Pomodoro.class, null, null)
            .sort(Comparator.comparing(p -> p.getSpec().getStartTime(), Comparator.reverseOrder()))
            .collectList();
    }

    public Mono<List<Pomodoro>> listFocusToday() {
        Instant todayStart = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
        return client.list(Pomodoro.class, null, null)
            .filter(p -> p.getSpec().getMode() == PomodoroMode.FOCUS
                && p.getSpec().getStartTime() != null
                && p.getSpec().getStartTime().isAfter(todayStart))
            .collectList();
    }

    public Mono<Pomodoro> create(Pomodoro pomodoro) {
        if (pomodoro.getMetadata().getName() == null || pomodoro.getMetadata().getName().isBlank()) {
            pomodoro.getMetadata().setName(UUID.randomUUID().toString());
        }
        if (pomodoro.getSpec().getStartTime() == null) {
            pomodoro.getSpec().setStartTime(Instant.now());
        }
        return client.create(pomodoro);
    }

    public Mono<Pomodoro> finish(String name) {
        return client.fetch(Pomodoro.class, name)
            .flatMap(p -> {
                p.getSpec().setEndTime(Instant.now());
                return client.update(p);
            });
    }
}
