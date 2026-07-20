package com.miaohaha.habit.service;

import com.miaohaha.habit.model.Habit;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import run.halo.app.extension.ReactiveExtensionClient;

@Service
@RequiredArgsConstructor
public class HabitService {

    private final ReactiveExtensionClient client;

    public Mono<List<Habit>> listAll() {
        return client.list(Habit.class, null, null)
            .sort(Comparator.comparing(h -> h.getSpec().getCreatedAt()))
            .collectList();
    }

    public Mono<Habit> getByName(String name) {
        return client.fetch(Habit.class, name);
    }

    public Mono<Habit> create(Habit habit) {
        if (habit.getMetadata().getName() == null || habit.getMetadata().getName().isBlank()) {
            habit.getMetadata().setName(UUID.randomUUID().toString());
        }
        if (habit.getSpec().getColor() == null || habit.getSpec().getColor().isBlank()) {
            habit.getSpec().setColor("#4A90D9");
        }
        if (habit.getSpec().getIcon() == null || habit.getSpec().getIcon().isBlank()) {
            habit.getSpec().setIcon("📋");
        }
        if (habit.getSpec().getTargetDays() == null) {
            habit.getSpec().setTargetDays(7);
        }
        habit.getSpec().setCreatedAt(java.time.Instant.now());
        habit.getSpec().setUpdatedAt(java.time.Instant.now());
        return client.create(habit);
    }

    public Mono<Habit> update(String name, Habit updated) {
        return client.fetch(Habit.class, name)
            .flatMap(existing -> {
                if (updated.getSpec().getName() != null) {
                    existing.getSpec().setName(updated.getSpec().getName());
                }
                if (updated.getSpec().getIcon() != null) {
                    existing.getSpec().setIcon(updated.getSpec().getIcon());
                }
                if (updated.getSpec().getColor() != null) {
                    existing.getSpec().setColor(updated.getSpec().getColor());
                }
                if (updated.getSpec().getTargetDays() != null) {
                    existing.getSpec().setTargetDays(updated.getSpec().getTargetDays());
                }
                existing.getSpec().setUpdatedAt(java.time.Instant.now());
                return client.update(existing);
            });
    }

    public Mono<Habit> delete(String name) {
        return client.fetch(Habit.class, name)
            .flatMap(client::delete)
            .thenReturn(null);
    }
}
