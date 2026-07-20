package com.miaohaha.habit.service;

import com.miaohaha.habit.model.CheckIn;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import run.halo.app.extension.ReactiveExtensionClient;

@Service
@RequiredArgsConstructor
public class CheckInService {

    private final ReactiveExtensionClient client;

    public Mono<List<CheckIn>> listByHabit(String habitName) {
        return client.list(CheckIn.class, null, null)
            .filter(c -> habitName.equals(c.getSpec().getHabitName()))
            .sort(Comparator.comparing(c -> c.getSpec().getCheckDate()))
            .collectList();
    }

    public Mono<List<CheckIn>> listByDate(LocalDate date) {
        return client.list(CheckIn.class, null, null)
            .filter(c -> date.equals(c.getSpec().getCheckDate()))
            .collectList();
    }

    public Mono<CheckIn> create(CheckIn checkIn) {
        if (checkIn.getMetadata().getName() == null || checkIn.getMetadata().getName().isBlank()) {
            checkIn.getMetadata().setName(UUID.randomUUID().toString());
        }
        if (checkIn.getSpec().getCheckDate() == null) {
            checkIn.getSpec().setCheckDate(LocalDate.now());
        }
        checkIn.getSpec().setCreatedAt(java.time.Instant.now());
        return client.create(checkIn);
    }

    public Mono<CheckIn> delete(String name) {
        return client.fetch(CheckIn.class, name)
            .flatMap(client::delete)
            .thenReturn(null);
    }

    /** 计算连续打卡天数（从今天往前数，中断即止） */
    public Mono<Integer> calculateStreak(String habitName) {
        return client.list(CheckIn.class, null, null)
            .filter(c -> habitName.equals(c.getSpec().getHabitName()))
            .map(c -> c.getSpec().getCheckDate())
            .collectList()
            .map(dates -> {
                if (dates.isEmpty()) return 0;
                dates.sort(java.util.Comparator.reverseOrder());
                LocalDate expected = LocalDate.now();
                int streak = 0;
                for (LocalDate d : dates) {
                    if (d.equals(expected)) {
                        streak++;
                        expected = expected.minusDays(1);
                    } else if (d.isBefore(expected)) {
                        break;
                    }
                }
                return streak;
            });
    }
}
