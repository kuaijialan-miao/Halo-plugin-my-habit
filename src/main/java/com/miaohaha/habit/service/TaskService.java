package com.miaohaha.habit.service;

import com.miaohaha.habit.model.Task;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import run.halo.app.extension.ReactiveExtensionClient;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final ReactiveExtensionClient client;

    public Mono<List<Task>> listAll() {
        return client.list(Task.class, null, null)
            .sort(Comparator.comparing(t -> t.getSpec().getCreatedAt(), Comparator.reverseOrder()))
            .collectList();
    }

    public Mono<Task> getByName(String name) {
        return client.fetch(Task.class, name);
    }

    public Mono<Task> create(Task task) {
        if (task.getMetadata().getName() == null || task.getMetadata().getName().isBlank()) {
            task.getMetadata().setName(UUID.randomUUID().toString());
        }
        if (task.getSpec().getStatus() == null) {
            task.getSpec().setStatus(Task.TaskStatus.TODO);
        }
        if (task.getSpec().getPriority() == null) {
            task.getSpec().setPriority(Task.TaskPriority.MEDIUM);
        }
        if (task.getSpec().getPomodoroCount() == null) {
            task.getSpec().setPomodoroCount(0);
        }
        if (task.getSpec().getEstimatedPomos() == null) {
            task.getSpec().setEstimatedPomos(1);
        }
        task.getSpec().setCreatedAt(java.time.Instant.now());
        task.getSpec().setUpdatedAt(java.time.Instant.now());
        return client.create(task);
    }

    public Mono<Task> update(String name, Task updated) {
        return client.fetch(Task.class, name)
            .flatMap(existing -> {
                if (updated.getSpec().getTitle() != null) {
                    existing.getSpec().setTitle(updated.getSpec().getTitle());
                }
                if (updated.getSpec().getPriority() != null) {
                    existing.getSpec().setPriority(updated.getSpec().getPriority());
                }
                if (updated.getSpec().getStatus() != null) {
                    existing.getSpec().setStatus(updated.getSpec().getStatus());
                }
                if (updated.getSpec().getEstimatedPomos() != null) {
                    existing.getSpec().setEstimatedPomos(updated.getSpec().getEstimatedPomos());
                }
                existing.getSpec().setUpdatedAt(java.time.Instant.now());
                return client.update(existing);
            });
    }

    public Mono<Task> incrementPomodoro(String name) {
        return client.fetch(Task.class, name)
            .flatMap(t -> {
                t.getSpec().setPomodoroCount(t.getSpec().getPomodoroCount() + 1);
                return client.update(t);
            });
    }

    public Mono<Task> delete(String name) {
        return client.fetch(Task.class, name)
            .flatMap(client::delete)
            .thenReturn(null);
    }
}
